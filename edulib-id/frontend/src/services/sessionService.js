import { storage, COLLECTIONS } from '../utils/storage.js';
import { eventService } from './eventService.js';

export const sessionService = {
  list({ studentId, type, from, to } = {}) {
    let items = storage.list(COLLECTIONS.SESSIONS);
    if (studentId) items = items.filter((s) => s.studentId === studentId);
    if (type) items = items.filter((s) => s.type === type);
    if (from) items = items.filter((s) => s.timestamp >= from);
    if (to) items = items.filter((s) => s.timestamp <= to);
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  create({ studentId, type, method = 'manual', notes }) {
    if (!['entry', 'exit'].includes(type)) {
      throw new Error('type deve ser entry ou exit');
    }
    const session = storage.create(COLLECTIONS.SESSIONS, {
      studentId,
      type,
      method,
      notes: notes || null,
      timestamp: new Date().toISOString(),
    });
    eventService.create({
      type: type === 'entry' ? 'session.entry' : 'session.exit',
      payload: { sessionId: session.id, studentId, method },
    });
    return session;
  },

  lastByStudent(studentId) {
    return this.list({ studentId })[0] || null;
  },

  countToday(type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = today.toISOString();
    return this.list({ type, from: iso }).length;
  },
};
