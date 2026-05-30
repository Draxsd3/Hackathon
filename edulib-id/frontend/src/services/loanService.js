import { storage, COLLECTIONS } from '../utils/storage.js';
import { addDays, isOverdue } from '../utils/dateUtils.js';
import { bookService } from './bookService.js';
import { eventService } from './eventService.js';
import { api, USE_BACKEND } from './api.js';

const DEFAULT_LOAN_DAYS = 7;

export const loanService = {
  async list({ studentId, status } = {}) {
    if (USE_BACKEND) {
      const response = await api.get('/loans', { params: { studentId, status } });
      return response.data.data;
    }

    let items = storage.list(COLLECTIONS.LOANS);
    if (studentId) items = items.filter((l) => l.studentId === studentId);
    if (status) items = items.filter((l) => l.status === status);
    return items.sort((a, b) => b.loanDate.localeCompare(a.loanDate));
  },

  async findById(id) {
    if (USE_BACKEND) {
      const response = await api.get(`/loans/${id}`);
      return response.data.data;
    }

    return storage.findById(COLLECTIONS.LOANS, id);
  },

  async activeByStudent(studentId) {
    return (await this.list({ studentId })).filter((l) => l.status !== 'returned');
  },

  async create({ studentId, bookId, days = DEFAULT_LOAN_DAYS, notes }) {
    if (USE_BACKEND) {
      const response = await api.post('/loans', { studentId, bookId, days, notes });
      return response.data.data;
    }

    const book = await bookService.findById(bookId);
    if (!book) throw new Error('Livro nao encontrado');
    if (book.available <= 0) throw new Error('Sem copias disponiveis');

    const loanDate = new Date();
    const dueDate = addDays(loanDate, days);

    const loan = storage.create(COLLECTIONS.LOANS, {
      studentId,
      bookId,
      loanDate: loanDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'active',
      notes: notes || null,
    });

    await bookService.decrementAvailable(bookId);
    await eventService.create({
      type: 'loan.created',
      payload: { loanId: loan.id, studentId, bookId, dueDate: loan.dueDate },
    });
    return loan;
  },

  async returnLoan(id) {
    if (USE_BACKEND) {
      const response = await api.post(`/loans/${id}/return`);
      return response.data.data;
    }

    const loan = await this.findById(id);
    if (!loan) throw new Error('Emprestimo nao encontrado');
    if (loan.status === 'returned') return loan;

    const updated = storage.update(COLLECTIONS.LOANS, id, {
      status: 'returned',
      returnDate: new Date().toISOString(),
    });
    await bookService.incrementAvailable(loan.bookId);
    await eventService.create({
      type: 'loan.returned',
      payload: { loanId: id, studentId: loan.studentId, bookId: loan.bookId },
    });
    return updated;
  },

  async refreshOverdueStatus() {
    if (USE_BACKEND) {
      const response = await api.post('/loans/refresh-overdue');
      return response.data.changed;
    }

    let changed = 0;
    storage.list(COLLECTIONS.LOANS).forEach((loan) => {
      if (loan.status === 'active' && isOverdue(loan.dueDate)) {
        storage.update(COLLECTIONS.LOANS, loan.id, { status: 'overdue' });
        changed += 1;
      }
    });
    return changed;
  },
};
