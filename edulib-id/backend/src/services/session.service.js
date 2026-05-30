const { randomUUID } = require('crypto');
const { getCollection } = require('../config/database');
const { buildSession } = require('../models/Session');
const eventService = require('./event.service');

const collection = () => getCollection('sessions');

function list({ studentId, type, from, to } = {}) {
  let items = Array.from(collection().values());
  if (studentId) items = items.filter((s) => s.studentId === studentId);
  if (type) items = items.filter((s) => s.type === type);
  if (from) items = items.filter((s) => s.timestamp >= from);
  if (to) items = items.filter((s) => s.timestamp <= to);
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function create(data) {
  const id = data.id || randomUUID();
  const session = buildSession({ ...data, id });
  collection().set(id, session);
  eventService.create({
    type: session.type === 'entry' ? 'session.entry' : 'session.exit',
    payload: { sessionId: id, studentId: session.studentId, method: session.method },
  });
  return session;
}

function lastByStudent(studentId) {
  return list({ studentId })[0] || null;
}

module.exports = { list, create, lastByStudent };
