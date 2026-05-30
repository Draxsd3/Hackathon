const { randomUUID } = require('crypto');
const { getCollection } = require('../config/database');
const { buildEvent } = require('../models/Event');

const collection = () => getCollection('events');

function list({ type, limit = 100 } = {}) {
  let items = Array.from(collection().values());
  if (type) items = items.filter((e) => e.type === type);
  return items
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

function create(data) {
  const id = data.id || randomUUID();
  const event = buildEvent({ ...data, id });
  collection().set(id, event);
  return event;
}

module.exports = { list, create };
