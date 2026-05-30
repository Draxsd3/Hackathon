import { storage, COLLECTIONS } from '../utils/storage.js';
import { isSameFace } from '../utils/facialUtils.js';
import { api, USE_BACKEND } from './api.js';

export const studentService = {
  async list({ search } = {}) {
    if (USE_BACKEND) {
      const response = await api.get('/students', { params: { search } });
      return response.data.data;
    }

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

  async findById(id) {
    if (USE_BACKEND) {
      const response = await api.get(`/students/${id}`);
      return response.data.data;
    }

    return storage.findById(COLLECTIONS.STUDENTS, id);
  },

  async findByRegistration(registration) {
    if (USE_BACKEND) {
      const students = await this.list({ search: registration });
      return students.find((s) => s.registration === registration) || null;
    }

    return storage.findOne(COLLECTIONS.STUDENTS, (s) => s.registration === registration);
  },

  async create(data) {
    const exists = await this.findByRegistration(data.registration);
    if (exists) {
      throw new Error('Ja existe um aluno com essa matricula');
    }

    if (USE_BACKEND) {
      const response = await api.post('/students', data);
      return response.data.data;
    }

    return storage.create(COLLECTIONS.STUDENTS, {
      active: true,
      ...data,
    });
  },

  async update(id, patch) {
    if (USE_BACKEND) {
      const response = await api.put(`/students/${id}`, patch);
      return response.data.data;
    }

    return storage.update(COLLECTIONS.STUDENTS, id, patch);
  },

  async remove(id) {
    if (USE_BACKEND) {
      await api.delete(`/students/${id}`);
      return true;
    }

    return storage.remove(COLLECTIONS.STUDENTS, id);
  },

  async identifyByFace(descriptor) {
    if (!descriptor) return null;
    const candidates = (await this.list()).filter((s) => s.faceDescriptor);
    for (const student of candidates) {
      if (isSameFace(student.faceDescriptor, descriptor)) return student;
    }
    return null;
  },
};
