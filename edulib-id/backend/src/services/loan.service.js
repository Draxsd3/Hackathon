const { randomUUID } = require('crypto');
const { getCollection } = require('../config/database');
const { buildLoan } = require('../models/Loan');
const bookService = require('./book.service');
const eventService = require('./event.service');

const collection = () => getCollection('loans');

const DEFAULT_LOAN_DAYS = 7;

function list({ studentId, status } = {}) {
  let items = Array.from(collection().values());
  if (studentId) items = items.filter((l) => l.studentId === studentId);
  if (status) items = items.filter((l) => l.status === status);
  return items.sort((a, b) => b.loanDate.localeCompare(a.loanDate));
}

function findById(id) {
  return collection().get(id) || null;
}

function create({ studentId, bookId, days = DEFAULT_LOAN_DAYS, notes }) {
  const book = bookService.findById(bookId);
  if (!book) {
    const err = new Error('Livro nao encontrado');
    err.status = 404;
    throw err;
  }
  if (book.available <= 0) {
    const err = new Error('Sem copias disponiveis');
    err.status = 409;
    throw err;
  }

  const id = randomUUID();
  const loanDate = new Date();
  const dueDate = new Date(loanDate.getTime() + days * 86400000);

  const loan = buildLoan({
    id,
    studentId,
    bookId,
    loanDate: loanDate.toISOString(),
    dueDate: dueDate.toISOString(),
    status: 'active',
    notes,
  });

  collection().set(id, loan);
  bookService.decrementAvailable(bookId);
  eventService.create({
    type: 'loan.created',
    payload: { loanId: id, studentId, bookId },
  });
  return loan;
}

function returnLoan(id) {
  const loan = findById(id);
  if (!loan) return null;
  if (loan.status === 'returned') return loan;
  const updated = buildLoan({
    ...loan,
    status: 'returned',
    returnDate: new Date().toISOString(),
  });
  collection().set(id, updated);
  bookService.incrementAvailable(loan.bookId);
  eventService.create({
    type: 'loan.returned',
    payload: { loanId: id, studentId: loan.studentId, bookId: loan.bookId },
  });
  return updated;
}

function markOverdue() {
  const now = new Date().toISOString();
  let changed = 0;
  for (const loan of collection().values()) {
    if (loan.status === 'active' && loan.dueDate < now) {
      collection().set(loan.id, { ...loan, status: 'overdue' });
      changed += 1;
    }
  }
  return changed;
}

module.exports = { list, findById, create, returnLoan, markOverdue };
