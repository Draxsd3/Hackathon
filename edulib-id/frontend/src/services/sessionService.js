import { storage, COLLECTIONS } from '../utils/storage.js';
import { eventService } from './eventService.js';
import { api, USE_BACKEND } from './api.js';

export const sessionService = {
  async list({ studentId, type, from, to } = {}) {
    if (USE_BACKEND) {
      const response = await api.get('/sessions', { params: { studentId, type, from, to } });
      return response.data.data;
    }

    let items = storage.list(COLLECTIONS.SESSIONS);
    if (studentId) items = items.filter((s) => s.studentId === studentId);
    if (type) items = items.filter((s) => s.type === type);
    if (from) items = items.filter((s) => s.timestamp >= from);
    if (to) items = items.filter((s) => s.timestamp <= to);
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  async create({ studentId, type, method = 'manual', notes }) {
    if (!['entry', 'exit'].includes(type)) {
      throw new Error('type deve ser entry ou exit');
    }

    if (USE_BACKEND) {
      const response = await api.post('/sessions', { studentId, type, method, notes });
      return response.data.data;
    }

    const session = storage.create(COLLECTIONS.SESSIONS, {
      studentId,
      type,
      method,
      notes: notes || null,
      timestamp: new Date().toISOString(),
    });
    await eventService.create({
      type: type === 'entry' ? 'session.entry' : 'session.exit',
      payload: { sessionId: session.id, studentId, method },
    });
    return session;
  },

  async lastByStudent(studentId) {
    if (USE_BACKEND) {
      const response = await api.get(`/sessions/last/${encodeURIComponent(studentId)}`);
      return response.data.data || null;
    }

    return (await this.list({ studentId }))[0] || null;
  },

  async countToday(type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = today.toISOString();
    return (await this.list({ type, from: iso })).length;
  },
};
