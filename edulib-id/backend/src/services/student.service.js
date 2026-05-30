const { randomUUID } = require('crypto');
const db = require('../config/database');
const supabaseRest = require('../config/supabaseRest');
const { buildStudent } = require('../models/Student');
const eventService = require('./event.service');

const patchColumns = {
  name: 'name',
  registration: 'registration',
  course: 'course',
  classGroup: 'class_group',
  email: 'email',
  photo: 'photo',
  faceDescriptor: 'face_descriptor',
  active: 'active',
};

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapStudent(row) {
  if (!row) return null;
  return buildStudent({
    id: row.id,
    name: row.name,
    registration: row.registration,
    course: row.course,
    classGroup: row.class_group,
    email: row.email,
    photo: row.photo,
    faceDescriptor: row.face_descriptor,
    active: row.active,
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
  return {
    id: data.id,
    name: data.name,
    registration: data.registration,
    course: nullableText(data.course),
    class_group: nullableText(data.classGroup),
    email: nullableText(data.email),
    photo: nullableText(data.photo),
    face_descriptor: data.faceDescriptor || null,
    active: data.active ?? true,
  };
}

function toPatchRow(patch) {
  const row = {};
  const nullableColumns = new Set(['course', 'class_group', 'email', 'photo']);

  for (const [key, column] of Object.entries(patchColumns)) {
    if (Object.prototype.hasOwnProperty.call(patch, key) && patch[key] !== undefined) {
      row[column] = nullableColumns.has(column) ? nullableText(patch[key]) : patch[key];
    }
  }
  return row;
}

function normalizeConflict(err) {
  if (err.code === '23505') {
    err.status = 409;
    err.message = 'Matricula ja cadastrada';
  }
  throw err;
}

async function list({ search } = {}) {
  if (supabaseRest.isEnabled()) {
    const query = {
      order: ['name.asc', 'created_at.desc'],
    };

    if (search) {
      const value = searchValue(search);
      query.or = [
        `name.ilike.*${value}*`,
        `registration.ilike.*${value}*`,
        `course.ilike.*${value}*`,
        `class_group.ilike.*${value}*`,
      ];
    }

    const rows = await supabaseRest.select('students', query);
    return rows.map(mapStudent);
  }

  const params = [];
  let where = '';

  if (search) {
    params.push(`%${search}%`);
    where = `
      where name ilike $1
        or registration ilike $1
        or coalesce(course, '') ilike $1
        or coalesce(class_group, '') ilike $1
    `;
  }

  const result = await db.query(
    `
      select *
      from students
      ${where}
      order by name asc, created_at desc
    `,
    params
  );

  return result.rows.map(mapStudent);
}

async function findById(id, client = db) {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.select('students', {
      filters: { id: `eq.${id}` },
      limit: 1,
    });
    return mapStudent(rows[0]);
  }

  const result = await client.query('select * from students where id = $1', [id]);
  return mapStudent(result.rows[0]);
}

async function findByRegistration(registration) {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.select('students', {
      filters: { registration: `eq.${registration}` },
      limit: 1,
    });
    return mapStudent(rows[0]);
  }

  const result = await db.query('select * from students where registration = $1', [registration]);
  return mapStudent(result.rows[0]);
}

async function create(data) {
  const id = data.id || randomUUID();

  try {
    if (supabaseRest.isEnabled()) {
      const rows = await supabaseRest.insert('students', toRow({ ...data, id }));
      const student = mapStudent(rows[0]);

      await eventService.create({
        type: 'student.created',
        payload: { studentId: student.id, name: student.name },
      });

      return student;
    }

    return await db.transaction(async (client) => {
      const result = await client.query(
        `
          insert into students (
            id, name, registration, course, class_group, email, photo, face_descriptor, active
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          returning *
        `,
        [
          id,
          data.name,
          data.registration,
          data.course || null,
          data.classGroup || null,
          data.email || null,
          data.photo || null,
          data.faceDescriptor || null,
          data.active ?? true,
        ]
      );
      const student = mapStudent(result.rows[0]);

      await eventService.create(
        {
          type: 'student.created',
          payload: { studentId: student.id, name: student.name },
        },
        client
      );

      return student;
    });
  } catch (err) {
    normalizeConflict(err);
  }
}

async function update(id, patch) {
  if (supabaseRest.isEnabled()) {
    const row = toPatchRow(patch);
    if (Object.keys(row).length === 0) return findById(id);

    try {
      const rows = await supabaseRest.update('students', { id: `eq.${id}` }, row);
      return mapStudent(rows[0]);
    } catch (err) {
      normalizeConflict(err);
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
        update students
        set ${sets.join(', ')}, updated_at = now()
        where id = $${values.length}
        returning *
      `,
      values
    );

    return mapStudent(result.rows[0]);
  } catch (err) {
    normalizeConflict(err);
  }
}

async function remove(id) {
  if (supabaseRest.isEnabled()) {
    const rows = await supabaseRest.remove('students', { id: `eq.${id}` });
    return rows.length > 0;
  }

  const result = await db.query('delete from students where id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { list, findById, findByRegistration, create, update, remove };
