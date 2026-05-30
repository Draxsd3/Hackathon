const { randomUUID } = require('crypto');
const { getCollection } = require('../config/database');
const { buildStudent } = require('../models/Student');

const collection = () => getCollection('students');

function list({ search } = {}) {
  const items = Array.from(collection().values());
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.registration.toLowerCase().includes(q) ||
      (s.classGroup || '').toLowerCase().includes(q)
  );
}

function findById(id) {
  return collection().get(id) || null;
}

function findByRegistration(registration) {
  return list().find((s) => s.registration === registration) || null;
}

function create(data) {
  const id = data.id || randomUUID();
  const student = buildStudent({ ...data, id });
  collection().set(id, student);
  return student;
}

function update(id, patch) {
  const current = findById(id);
  if (!current) return null;
  const updated = buildStudent({
    ...current,
    ...patch,
    id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });
  collection().set(id, updated);
  return updated;
}

function remove(id) {
  return collection().delete(id);
}

module.exports = { list, findById, findByRegistration, create, update, remove };
