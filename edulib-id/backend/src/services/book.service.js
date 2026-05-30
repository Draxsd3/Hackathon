const { randomUUID } = require('crypto');
const { getCollection } = require('../config/database');
const { buildBook } = require('../models/Book');

const collection = () => getCollection('books');

function list({ search } = {}) {
  const items = Array.from(collection().values());
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn || '').toLowerCase().includes(q)
  );
}

function findById(id) {
  return collection().get(id) || null;
}

function create(data) {
  const id = data.id || randomUUID();
  const book = buildBook({ ...data, id });
  collection().set(id, book);
  return book;
}

function update(id, patch) {
  const current = findById(id);
  if (!current) return null;
  const updated = buildBook({
    ...current,
    ...patch,
    id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });
  collection().set(id, updated);
  return updated;
}

function decrementAvailable(id) {
  const book = findById(id);
  if (!book || book.available <= 0) return null;
  return update(id, { available: book.available - 1 });
}

function incrementAvailable(id) {
  const book = findById(id);
  if (!book) return null;
  const next = Math.min(book.copies, book.available + 1);
  return update(id, { available: next });
}

function remove(id) {
  return collection().delete(id);
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove,
  decrementAvailable,
  incrementAvailable,
};
