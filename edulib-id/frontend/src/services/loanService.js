import { storage, COLLECTIONS } from '../utils/storage.js';
import { addDays, isOverdue } from '../utils/dateUtils.js';
import { bookService } from './bookService.js';
import { eventService } from './eventService.js';

const DEFAULT_LOAN_DAYS = 7;

export const loanService = {
  list({ studentId, status } = {}) {
    let items = storage.list(COLLECTIONS.LOANS);
    if (studentId) items = items.filter((l) => l.studentId === studentId);
    if (status) items = items.filter((l) => l.status === status);
    return items.sort((a, b) => b.loanDate.localeCompare(a.loanDate));
  },

  findById(id) {
    return storage.findById(COLLECTIONS.LOANS, id);
  },

  activeByStudent(studentId) {
    return this.list({ studentId }).filter((l) => l.status !== 'returned');
  },

  create({ studentId, bookId, days = DEFAULT_LOAN_DAYS, notes }) {
    const book = bookService.findById(bookId);
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

    bookService.decrementAvailable(bookId);
    eventService.create({
      type: 'loan.created',
      payload: { loanId: loan.id, studentId, bookId, dueDate: loan.dueDate },
    });
    return loan;
  },

  returnLoan(id) {
    const loan = this.findById(id);
    if (!loan) throw new Error('Emprestimo nao encontrado');
    if (loan.status === 'returned') return loan;

    const updated = storage.update(COLLECTIONS.LOANS, id, {
      status: 'returned',
      returnDate: new Date().toISOString(),
    });
    bookService.incrementAvailable(loan.bookId);
    eventService.create({
      type: 'loan.returned',
      payload: { loanId: id, studentId: loan.studentId, bookId: loan.bookId },
    });
    return updated;
  },

  refreshOverdueStatus() {
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
