const { randomUUID } = require('crypto');
const db = require('../config/database');
const supabaseRest = require('../config/supabaseRest');
const { buildLoan } = require('../models/Loan');
const eventService = require('./event.service');

const DEFAULT_LOAN_DAYS = 7;

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapLoan(row) {
  if (!row) return null;
  return buildLoan({
    id: row.id,
    studentId: row.student_id,
    bookId: row.book_id,
    loanDate: toIso(row.loan_date),
    dueDate: toIso(row.due_date),
    returnDate: toIso(row.return_date),
    status: row.status,
    notes: row.notes,
  });
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

async function list({ studentId, status } = {}) {
  if (supabaseRest.isEnabled()) {
    const filters = {};
    if (studentId) filters.student_id = `eq.${studentId}`;
    if (status) filters.status = `eq.${status}`;

    const rows = await supabaseRest.select('loans', {
      filters,
      order: 'loan_date.desc',
    });

    return rows.map(mapLoan);
  }

  const clauses = [];
  const params = [];

  if (studentId) {
    params.push(studentId);
    clauses.push(`student_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }

  const result = await db.query(
    `
      select *
      from loans
      ${clauses.length ? `where ${clauses.join(' and ')}` : ''}
      order by loan_date desc
    `,
    params
  );

  return result.rows.map(mapLoan);
}

async function findById(id, client = db) {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.select('loans', {
      filters: { id: `eq.${id}` },
      limit: 1,
    });
    return mapLoan(rows[0]);
  }

  const result = await client.query('select * from loans where id = $1', [id]);
  return mapLoan(result.rows[0]);
}

async function create({ studentId, bookId, days = DEFAULT_LOAN_DAYS, notes }) {
  if (supabaseRest.isEnabled()) {
    const studentRows = await supabaseRest.select('students', {
      select: 'id',
      filters: { id: `eq.${studentId}` },
      limit: 1,
    });
    if (studentRows.length === 0) throw notFound('Aluno nao encontrado');

    const bookRows = await supabaseRest.select('books', {
      filters: { id: `eq.${bookId}` },
      limit: 1,
    });
    const book = bookRows[0];
    if (!book) throw notFound('Livro nao encontrado');
    if (book.available <= 0) throw conflict('Sem copias disponiveis');

    const id = randomUUID();
    const loanDate = new Date();
    const dueDate = new Date(loanDate.getTime() + Number(days || DEFAULT_LOAN_DAYS) * 86400000);

    const rows = await supabaseRest.insert('loans', {
      id,
      student_id: studentId,
      book_id: bookId,
      loan_date: loanDate,
      due_date: dueDate,
      status: 'active',
      notes: notes || null,
    });

    await supabaseRest.update('books', { id: `eq.${bookId}` }, { available: book.available - 1 });

    await eventService.create({
      type: 'loan.created',
      payload: { loanId: id, studentId, bookId, dueDate: dueDate.toISOString() },
    });

    return mapLoan(rows[0]);
  }

  return db.transaction(async (client) => {
    const studentResult = await client.query('select id from students where id = $1', [studentId]);
    if (studentResult.rowCount === 0) throw notFound('Aluno nao encontrado');

    const bookResult = await client.query('select * from books where id = $1 for update', [bookId]);
    const book = bookResult.rows[0];
    if (!book) {
      throw notFound('Livro nao encontrado');
    }
    if (book.available <= 0) {
      throw conflict('Sem copias disponiveis');
    }

    const id = randomUUID();
    const loanDate = new Date();
    const dueDate = new Date(loanDate.getTime() + Number(days || DEFAULT_LOAN_DAYS) * 86400000);

    const result = await client.query(
      `
        insert into loans (id, student_id, book_id, loan_date, due_date, status, notes)
        values ($1, $2, $3, $4, $5, 'active', $6)
        returning *
      `,
      [id, studentId, bookId, loanDate, dueDate, notes || null]
    );

    await client.query(
      `
        update books
        set available = available - 1, updated_at = now()
        where id = $1
      `,
      [bookId]
    );

    await eventService.create({
      type: 'loan.created',
      payload: { loanId: id, studentId, bookId, dueDate: dueDate.toISOString() },
    }, client);

    return mapLoan(result.rows[0]);
  });
}

async function returnLoan(id) {
  if (supabaseRest.isEnabled()) {
    const loanRows = await supabaseRest.select('loans', {
      filters: { id: `eq.${id}` },
      limit: 1,
    });
    const current = loanRows[0];
    if (!current) return null;
    if (current.status === 'returned') return mapLoan(current);

    const rows = await supabaseRest.update(
      'loans',
      { id: `eq.${id}` },
      { status: 'returned', return_date: new Date().toISOString() }
    );
    const updated = mapLoan(rows[0]);

    const bookRows = await supabaseRest.select('books', {
      filters: { id: `eq.${updated.bookId}` },
      limit: 1,
    });
    const book = bookRows[0];
    if (book) {
      await supabaseRest.update(
        'books',
        { id: `eq.${updated.bookId}` },
        { available: Math.min(book.copies, book.available + 1) }
      );
    }

    await eventService.create({
      type: 'loan.returned',
      payload: { loanId: id, studentId: updated.studentId, bookId: updated.bookId },
    });

    return updated;
  }

  return db.transaction(async (client) => {
    const currentResult = await client.query('select * from loans where id = $1 for update', [id]);
    const current = currentResult.rows[0];
    if (!current) return null;
    if (current.status === 'returned') return mapLoan(current);

    const result = await client.query(
      `
        update loans
        set status = 'returned', return_date = now(), updated_at = now()
        where id = $1
        returning *
      `,
      [id]
    );
    const updated = mapLoan(result.rows[0]);

    await client.query(
      `
        update books
        set available = least(copies, available + 1), updated_at = now()
        where id = $1
      `,
      [updated.bookId]
    );

    await eventService.create({
      type: 'loan.returned',
      payload: { loanId: id, studentId: updated.studentId, bookId: updated.bookId },
    }, client);

    return updated;
  });
}

async function markOverdue() {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.update(
      'loans',
      { status: 'eq.active', due_date: `lt.${new Date().toISOString()}` },
      { status: 'overdue' }
    );
    return rows.length;
  }

  const result = await db.query(
    `
      update loans
      set status = 'overdue', updated_at = now()
      where status = 'active' and due_date < now()
      returning id
    `
  );
  return result.rowCount;
}

module.exports = { list, findById, create, returnLoan, markOverdue };
