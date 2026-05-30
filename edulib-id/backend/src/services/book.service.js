const { randomUUID } = require('crypto');
const db = require('../config/database');
const supabaseRest = require('../config/supabaseRest');
const { buildBook } = require('../models/Book');

const patchColumns = {
  title: 'title',
  author: 'author',
  isbn: 'isbn',
  category: 'category',
  rfid: 'rfid',
  copyCode: 'copy_code',
  course: 'course',
  discipline: 'discipline',
  location: 'location',
  row: 'row_code',
  shelf: 'shelf',
  cover: 'cover',
  copies: 'copies',
  available: 'available',
};

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapBook(row) {
  if (!row) return null;
  return buildBook({
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    category: row.category,
    rfid: row.rfid,
    copyCode: row.copy_code,
    course: row.course,
    discipline: row.discipline,
    location: row.location,
    row: row.row_code,
    shelf: row.shelf,
    cover: row.cover,
    copies: row.copies,
    available: row.available,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  });
}

function searchValue(search) {
  return String(search || '').replace(/[(),]/g, ' ').trim();
}

function nullableText(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function toRow(data) {
  const copies = Number(data.copies) || 1;
  return {
    id: data.id,
    title: data.title,
    author: data.author,
    isbn: nullableText(data.isbn),
    category: data.category || 'Geral',
    rfid: nullableText(data.rfid),
    copy_code: nullableText(data.copyCode),
    course: nullableText(data.course),
    discipline: nullableText(data.discipline),
    location: nullableText(data.location),
    row_code: nullableText(data.row),
    shelf: nullableText(data.shelf),
    cover: nullableText(data.cover),
    copies,
    available: data.available ?? copies,
  };
}

function toPatchRow(patch) {
  const row = {};
  const nullableColumns = new Set([
    'isbn',
    'rfid',
    'copy_code',
    'course',
    'discipline',
    'location',
    'row_code',
    'shelf',
    'cover',
  ]);

  for (const [key, column] of Object.entries(patchColumns)) {
    if (Object.prototype.hasOwnProperty.call(patch, key) && patch[key] !== undefined) {
      row[column] = nullableColumns.has(column) ? nullableText(patch[key]) : patch[key];
    }
  }
  return row;
}

function normalizeBookError(err) {
  if (err.code === '23505') {
    err.status = 409;
    if (String(err.constraint || '').includes('rfid')) err.message = 'RFID ja vinculado a outro livro';
    else if (String(err.constraint || '').includes('copy_code')) err.message = 'Codigo do exemplar ja cadastrado';
    else err.message = 'ISBN ja cadastrado';
  }
  if (err.code === '23514') {
    err.status = 400;
    err.message = 'Dados invalidos para copias/disponibilidade';
  }
  throw err;
}

async function list({ search } = {}) {
  if (supabaseRest.isEnabled()) {
    const query = {
      order: ['title.asc', 'author.asc'],
    };

    if (search) {
      const value = searchValue(search);
      query.or = [
        `title.ilike.*${value}*`,
        `author.ilike.*${value}*`,
        `isbn.ilike.*${value}*`,
        `category.ilike.*${value}*`,
        `rfid.ilike.*${value}*`,
        `copy_code.ilike.*${value}*`,
        `location.ilike.*${value}*`,
        `row_code.ilike.*${value}*`,
      ];
    }

    const rows = await supabaseRest.select('books', query);
    return rows.map(mapBook);
  }

  const params = [];
  let where = '';

  if (search) {
    params.push(`%${search}%`);
    where = `
      where title ilike $1
        or author ilike $1
        or coalesce(isbn, '') ilike $1
        or coalesce(category, '') ilike $1
        or coalesce(rfid, '') ilike $1
        or coalesce(copy_code, '') ilike $1
        or coalesce(location, '') ilike $1
        or coalesce(row_code, '') ilike $1
    `;
  }

  const result = await db.query(
    `
      select *
      from books
      ${where}
      order by title asc, author asc
    `,
    params
  );

  return result.rows.map(mapBook);
}

async function findById(id, client = db) {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.select('books', {
      filters: { id: `eq.${id}` },
      limit: 1,
    });
    return mapBook(rows[0]);
  }

  const result = await client.query('select * from books where id = $1', [id]);
  return mapBook(result.rows[0]);
}

async function create(data) {
  const id = data.id || randomUUID();
  const copies = Number(data.copies) || 1;
  const available = data.available ?? copies;

  try {
    if (supabaseRest.isEnabled()) {
      const rows = await supabaseRest.insert('books', toRow({ ...data, id, copies, available }));
      return mapBook(rows[0]);
    }

    const result = await db.query(
      `
        insert into books (id, title, author, isbn, category, rfid, copy_code, course, discipline, location, row_code, shelf, cover, copies, available)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        returning *
      `,
      [
        id,
        data.title,
        data.author,
        data.isbn || null,
        data.category || 'Geral',
        data.rfid || null,
        data.copyCode || null,
        data.course || null,
        data.discipline || null,
        data.location || null,
        data.row || null,
        data.shelf || null,
        data.cover || null,
        copies,
        available,
      ]
    );

    return mapBook(result.rows[0]);
  } catch (err) {
    normalizeBookError(err);
  }
}

async function update(id, patch) {
  if (supabaseRest.isEnabled()) {
    const row = toPatchRow(patch);
    if (Object.keys(row).length === 0) return findById(id);

    try {
      const rows = await supabaseRest.update('books', { id: `eq.${id}` }, row);
      return mapBook(rows[0]);
    } catch (err) {
      normalizeBookError(err);
    }
  }

  const sets = [];
  const values = [];

  for (const [key, column] of Object.entries(patchColumns)) {
    if (Object.prototype.hasOwnProperty.call(patch, key) && patch[key] !== undefined) {
      values.push(patch[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }

  if (sets.length === 0) return findById(id);

  values.push(id);

  try {
    const result = await db.query(
      `
        update books
        set ${sets.join(', ')}, updated_at = now()
        where id = $${values.length}
        returning *
      `,
      values
    );

    return mapBook(result.rows[0]);
  } catch (err) {
    normalizeBookError(err);
  }
}

async function decrementAvailable(id) {
  if (supabaseRest.isEnabled()) {
    const current = await findById(id);
    if (!current || current.available <= 0) return null;

    const rows = await supabaseRest.update(
      'books',
      { id: `eq.${id}` },
      { available: current.available - 1 }
    );

    return mapBook(rows[0]);
  }

  const result = await db.query(
    `
      update books
      set available = available - 1, updated_at = now()
      where id = $1 and available > 0
      returning *
    `,
    [id]
  );
  return mapBook(result.rows[0]);
}

async function incrementAvailable(id) {
  if (supabaseRest.isEnabled()) {
    const current = await findById(id);
    if (!current) return null;

    const rows = await supabaseRest.update(
      'books',
      { id: `eq.${id}` },
      { available: Math.min(current.copies, current.available + 1) }
    );

    return mapBook(rows[0]);
  }

  const result = await db.query(
    `
      update books
      set available = least(copies, available + 1), updated_at = now()
      where id = $1
      returning *
    `,
    [id]
  );
  return mapBook(result.rows[0]);
}

async function remove(id) {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.remove('books', { id: `eq.${id}` });
    return rows.length > 0;
  }

  const result = await db.query('delete from books where id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  list,
  findById,
  mapBook,
  create,
  update,
  remove,
  decrementAvailable,
  incrementAvailable,
};
