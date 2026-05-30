import { storage, COLLECTIONS } from '../utils/storage.js';
import { api, USE_BACKEND } from './api.js';

export const bookService = {
  async list({ search } = {}) {
    if (USE_BACKEND) {
      const response = await api.get('/books', { params: { search } });
      return response.data.data;
    }

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

  async findById(id) {
    if (USE_BACKEND) {
      const response = await api.get(`/books/${id}`);
      return response.data.data;
    }

    return storage.findById(COLLECTIONS.BOOKS, id);
  },

  async create(data) {
    const copies = Number(data.copies) || 1;
    if (USE_BACKEND) {
      const response = await api.post('/books', {
        category: 'Geral',
        ...data,
        copies,
        available: data.available ?? copies,
      });
      return response.data.data;
    }

    return storage.create(COLLECTIONS.BOOKS, {
      category: 'Geral',
      ...data,
      copies,
      available: data.available ?? copies,
    });
  },

  async update(id, patch) {
    if (USE_BACKEND) {
      const response = await api.put(`/books/${id}`, patch);
      return response.data.data;
    }

    return storage.update(COLLECTIONS.BOOKS, id, patch);
  },

  async remove(id) {
    if (USE_BACKEND) {
      await api.delete(`/books/${id}`);
      return true;
    }

    return storage.remove(COLLECTIONS.BOOKS, id);
  },

  async decrementAvailable(id) {
    const book = await this.findById(id);
    if (!book || book.available <= 0) return null;
    return this.update(id, { available: book.available - 1 });
  },

  async incrementAvailable(id) {
    const book = await this.findById(id);
    if (!book) return null;
    const next = Math.min(book.copies, book.available + 1);
    return this.update(id, { available: next });
  },
};
