import { storage, COLLECTIONS } from '../utils/storage.js';

export const eventService = {
  list({ type, limit = 100 } = {}) {
    let items = storage.list(COLLECTIONS.EVENTS);
    if (type) items = items.filter((e) => e.type === type);
    return items
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  },

  create({ type, payload = {}, actor = 'system' }) {
    return storage.create(COLLECTIONS.EVENTS, {
      type,
      payload,
      actor,
      timestamp: new Date().toISOString(),
    });
  },
};
