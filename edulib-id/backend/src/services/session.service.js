const { randomUUID } = require('crypto');
const db = require('../config/database');
const supabaseRest = require('../config/supabaseRest');
const { buildSession } = require('../models/Session');
const eventService = require('./event.service');

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapSession(row) {
  if (!row) return null;
  return buildSession({
    id: row.id,
    studentId: row.student_id,
    type: row.type,
    method: row.method,
    notes: row.notes,
    timestamp: toIso(row.timestamp),
  });
}

function recordSessionEvent(session) {
  return eventService.create({
    type: session.type === 'entry' ? 'session.entry' : 'session.exit',
    payload: { sessionId: session.id, studentId: session.studentId, method: session.method },
  });
}

async function list({ studentId, type, from, to } = {}) {
  if (supabaseRest.isEnabled()) {
    const filters = {};
    const timestampFilters = [];
    if (studentId) filters.student_id = `eq.${studentId}`;
    if (type) filters.type = `eq.${type}`;
    if (from) timestampFilters.push(`gte.${from}`);
    if (to) timestampFilters.push(`lte.${to}`);
    if (timestampFilters.length) filters.timestamp = timestampFilters;

    const rows = await supabaseRest.select('sessions', {
      filters,
      order: 'timestamp.desc',
    });

    return rows.map(mapSession);
  }

  const clauses = [];
  const params = [];

  if (studentId) {
    params.push(studentId);
    clauses.push(`student_id = $${params.length}`);
  }
  if (type) {
    params.push(type);
    clauses.push(`type = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`timestamp >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`timestamp <= $${params.length}`);
  }

  const result = await db.query(
    `
      select *
      from sessions
      ${clauses.length ? `where ${clauses.join(' and ')}` : ''}
      order by timestamp desc
    `,
    params
  );

  return result.rows.map(mapSession);
}

async function create(data) {
  const id = data.id || randomUUID();

  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.insert('sessions', {
      id,
      student_id: data.studentId,
      type: data.type,
      method: data.method || 'manual',
      notes: data.notes || null,
    });
    const session = mapSession(rows[0]);

    recordSessionEvent(session).catch((err) => {
      console.warn('[sessions] Nao foi possivel registrar evento da sessao:', err.message);
    });

    return session;
  }

  return db.transaction(async (client) => {
    const result = await client.query(
      `
        insert into sessions (id, student_id, type, method, notes)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [id, data.studentId, data.type, data.method || 'manual', data.notes || null]
    );
    const session = mapSession(result.rows[0]);

    await eventService.create({
      type: session.type === 'entry' ? 'session.entry' : 'session.exit',
      payload: { sessionId: id, studentId: session.studentId, method: session.method },
    }, client);

    return session;
  });
}

async function lastByStudent(studentId) {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.select('sessions', {
      filters: { student_id: `eq.${studentId}` },
      order: 'timestamp.desc',
      limit: 1,
    });
    return mapSession(rows[0]);
  }

  const result = await db.query(
    `
      select *
      from sessions
      where student_id = $1
      order by timestamp desc
      limit 1
    `,
    [studentId]
  );
  return mapSession(result.rows[0]);
}

module.exports = { list, create, lastByStudent };
