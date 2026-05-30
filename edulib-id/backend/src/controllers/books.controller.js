const bookService = require('../services/book.service');

function index(req, res) {
  res.json({ data: bookService.list({ search: req.query.search }) });
}

function show(req, res) {
  const book = bookService.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'NotFound' });
  res.json({ data: book });
}

function create(req, res) {
  const book = bookService.create(req.body);
  res.status(201).json({ data: book });
}

function update(req, res) {
  const book = bookService.update(req.params.id, req.body);
  if (!book) return res.status(404).json({ error: 'NotFound' });
  res.json({ data: book });
}

function destroy(req, res) {
  const ok = bookService.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'NotFound' });
  res.status(204).send();
}

module.exports = { index, show, create, update, destroy };
