import { storage, COLLECTIONS } from '../utils/storage.js';

export const bookService = {
  list({ search } = {}) {
    const all = storage.list(COLLECTIONS.BOOKS);
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q)
    );
  },

  findById(id) {
    return storage.findById(COLLECTIONS.BOOKS, id);
  },

  create(data) {
    const copies = Number(data.copies) || 1;
    return storage.create(COLLECTIONS.BOOKS, {
      category: 'Geral',
      ...data,
      copies,
      available: data.available ?? copies,
    });
  },

  update(id, patch) {
    return storage.update(COLLECTIONS.BOOKS, id, patch);
  },

  remove(id) {
    return storage.remove(COLLECTIONS.BOOKS, id);
  },

  decrementAvailable(id) {
    const book = this.findById(id);
    if (!book || book.available <= 0) return null;
    return this.update(id, { available: book.available - 1 });
  },

  incrementAvailable(id) {
    const book = this.findById(id);
    if (!book) return null;
    const next = Math.min(book.copies, book.available + 1);
    return this.update(id, { available: next });
  },
};
