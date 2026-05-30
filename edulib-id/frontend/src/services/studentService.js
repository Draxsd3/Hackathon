import { storage, COLLECTIONS } from '../utils/storage.js';
import { isSameFace } from '../utils/facialUtils.js';

export const studentService = {
  list({ search } = {}) {
    const all = storage.list(COLLECTIONS.STUDENTS);
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registration.toLowerCase().includes(q) ||
        (s.classGroup || '').toLowerCase().includes(q)
    );
  },

  findById(id) {
    return storage.findById(COLLECTIONS.STUDENTS, id);
  },

  findByRegistration(registration) {
    return storage.findOne(COLLECTIONS.STUDENTS, (s) => s.registration === registration);
  },

  create(data) {
    const exists = this.findByRegistration(data.registration);
    if (exists) {
      throw new Error('Ja existe um aluno com essa matricula');
    }
    return storage.create(COLLECTIONS.STUDENTS, {
      active: true,
      ...data,
    });
  },

  update(id, patch) {
    return storage.update(COLLECTIONS.STUDENTS, id, patch);
  },

  remove(id) {
    return storage.remove(COLLECTIONS.STUDENTS, id);
  },

  identifyByFace(descriptor) {
    if (!descriptor) return null;
    const candidates = storage.list(COLLECTIONS.STUDENTS).filter((s) => s.faceDescriptor);
    for (const student of candidates) {
      if (isSameFace(student.faceDescriptor, descriptor)) return student;
    }
    return null;
  },
};
