const bookService = require('../services/book.service');

async function index(req, res, next) {
  try {
    res.json({ data: await bookService.list({ search: req.query.search }) });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    const book = await bookService.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: book });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const book = await bookService.create(req.body);
    res.status(201).json({ data: book });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const book = await bookService.update(req.params.id, req.body);
    if (!book) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: book });
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const ok = await bookService.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'NotFound' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, create, update, destroy };
