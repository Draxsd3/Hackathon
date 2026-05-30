import { storage, COLLECTIONS } from './storage.js';

const SEED_FLAG = 'seeded:v1';

const INITIAL_BOOKS = [
  { title: 'Dom Casmurro', author: 'Machado de Assis', category: 'Literatura Brasileira', copies: 3, available: 3, isbn: '9788535910658' },
  { title: 'O Pequeno Principe', author: 'Antoine de Saint-Exupery', category: 'Infanto-juvenil', copies: 5, available: 5, isbn: '9788574068008' },
  { title: 'Vidas Secas', author: 'Graciliano Ramos', category: 'Literatura Brasileira', copies: 2, available: 2, isbn: '9788501405814' },
  { title: 'A Revolucao dos Bichos', author: 'George Orwell', category: 'Ficcao', copies: 4, available: 4, isbn: '9788535909555' },
  { title: '1984', author: 'George Orwell', category: 'Ficcao', copies: 3, available: 3, isbn: '9788535914849' },
  { title: 'Capitaes da Areia', author: 'Jorge Amado', category: 'Literatura Brasileira', copies: 2, available: 2, isbn: '9788535914832' },
  { title: 'Memorias Postumas de Bras Cubas', author: 'Machado de Assis', category: 'Literatura Brasileira', copies: 2, available: 2, isbn: '9788535910641' },
  { title: 'O Cortico', author: 'Aluisio Azevedo', category: 'Literatura Brasileira', copies: 2, available: 2, isbn: '9788508133086' },
  { title: 'O Senhor dos Aneis: A Sociedade do Anel', author: 'J.R.R. Tolkien', category: 'Fantasia', copies: 2, available: 2, isbn: '9788595084759' },
  { title: 'Harry Potter e a Pedra Filosofal', author: 'J.K. Rowling', category: 'Fantasia', copies: 4, available: 4, isbn: '9788532530783' },
];

export function ensureSeedData() {
  const meta = storage.findOne(COLLECTIONS.META, (m) => m.key === SEED_FLAG);
  if (meta) return false;

  INITIAL_BOOKS.forEach((book) => storage.create(COLLECTIONS.BOOKS, book));
  storage.create(COLLECTIONS.META, { key: SEED_FLAG, seededAt: new Date().toISOString() });
  return true;
}
