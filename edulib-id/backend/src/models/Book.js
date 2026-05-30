function buildBook({
  id,
  title,
  author,
  isbn,
  category,
  copies = 1,
  available,
  cover,
  createdAt,
  updatedAt,
}) {
  return {
    id,
    title,
    author,
    isbn: isbn || null,
    category: category || 'Geral',
    copies,
    available: available ?? copies,
    cover: cover || null,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  };
}

module.exports = { buildBook };
