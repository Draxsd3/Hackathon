/**
 * Camada de persistencia do MVP.
 *
 * Implementa um repositorio generico sobre localStorage com a mesma forma
 * de uma API REST (list / get / create / update / remove / query).
 *
 * Para migrar para backend real (PostgreSQL / Supabase / API Express):
 *  - troque o `adapter` abaixo para `httpAdapter` em `services/api.js`
 *  - os services nao precisam mudar
 */

const NAMESPACE = 'edulib-id';
const VERSION = 'v1';

function key(collection) {
  return `${NAMESPACE}:${VERSION}:${collection}`;
}

function readCollection(collection) {
  try {
    const raw = localStorage.getItem(key(collection));
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[storage] erro ao ler', collection, err);
    return [];
  }
}

function writeCollection(collection, items) {
  try {
    localStorage.setItem(key(collection), JSON.stringify(items));
  } catch (err) {
    console.error('[storage] erro ao gravar', collection, err);
    throw err;
  }
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const storage = {
  list(collection) {
    return readCollection(collection);
  },

  query(collection, predicate) {
    return readCollection(collection).filter(predicate);
  },

  findById(collection, id) {
    return readCollection(collection).find((item) => item.id === id) || null;
  },

  findOne(collection, predicate) {
    return readCollection(collection).find(predicate) || null;
  },

  create(collection, data) {
    const items = readCollection(collection);
    const now = new Date().toISOString();
    const record = {
      id: data.id || uuid(),
      createdAt: data.createdAt || now,
      updatedAt: now,
      ...data,
    };
    items.push(record);
    writeCollection(collection, items);
    return record;
  },

  update(collection, id, patch) {
    const items = readCollection(collection);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
    writeCollection(collection, items);
    return items[index];
  },

  remove(collection, id) {
    const items = readCollection(collection);
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return false;
    writeCollection(collection, next);
    return true;
  },

  clear(collection) {
    localStorage.removeItem(key(collection));
  },

  clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${NAMESPACE}:${VERSION}:`))
      .forEach((k) => localStorage.removeItem(k));
  },

  uuid,
};

export const COLLECTIONS = {
  STUDENTS: 'students',
  BOOKS: 'books',
  SESSIONS: 'sessions',
  LOANS: 'loans',
  EVENTS: 'events',
  META: 'meta',
};
