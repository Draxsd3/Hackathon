import { storage, COLLECTIONS } from '../utils/storage.js';
import { api, USE_BACKEND } from './api.js';

export const eventService = {
  async list({ type, limit = 100 } = {}) {
    if (USE_BACKEND) {
      const response = await api.get('/events', { params: { type, limit } });
      return response.data.data;
    }

    let items = storage.list(COLLECTIONS.EVENTS);
    if (type) items = items.filter((e) => e.type === type);
    return items
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  },

  async create({ type, payload = {}, actor = 'system' }) {
    if (USE_BACKEND) {
      const response = await api.post('/events', { type, payload, actor });
      return response.data.data;
    }

    return storage.create(COLLECTIONS.EVENTS, {
      type,
      payload,
      actor,
      timestamp: new Date().toISOString(),
    });
  },
};
