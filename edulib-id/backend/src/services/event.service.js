const { randomUUID } = require('crypto');
const db = require('../config/database');
const supabaseRest = require('../config/supabaseRest');
const { buildEvent } = require('../models/Event');

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapEvent(row) {
  if (!row) return null;
  return buildEvent({
    id: row.id,
    type: row.type,
    actor: row.actor,
    payload: row.payload,
    timestamp: toIso(row.timestamp),
  });
}

async function list({ type, limit = 100 } = {}) {
  if (supabaseRest.isEnabled()) {
    const filters = {};
    if (type) filters.type = `eq.${type}`;

    const rows = await supabaseRest.select('events', {
      filters,
      order: 'timestamp.desc',
      limit: Math.min(Math.max(Number(limit) || 100, 1), 500),
    });

    return rows.map(mapEvent);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const params = [safeLimit];
  let where = '';

  if (type) {
    params.push(type);
    where = 'where type = $2';
  }

  const result = await db.query(
    `
      select *
      from events
      ${where}
      order by timestamp desc
      limit $1
    `,
    params
  );

  return result.rows.map(mapEvent);
}

async function create(data, client = db) {
  const id = data.id || randomUUID();

  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.insert('events', {
      id,
      type: data.type,
      actor: data.actor || 'system',
      payload: data.payload || {},
    });

    return mapEvent(rows[0]);
  }

  const result = await client.query(
    `
      insert into events (id, type, actor, payload)
      values ($1, $2, $3, $4)
      returning *
    `,
    [id, data.type, data.actor || 'system', data.payload || {}]
  );

  return mapEvent(result.rows[0]);
}

module.exports = { list, create };
