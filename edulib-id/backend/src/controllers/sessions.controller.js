const sessionService = require('../services/session.service');

async function index(req, res, next) {
  try {
    res.json({ data: await sessionService.list(req.query) });
  } catch (err) {
    next(err);
  }
}

async function lastByStudent(req, res, next) {
  try {
    res.json({ data: await sessionService.lastByStudent(req.params.studentId) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { studentId, type } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: 'ValidationError', message: 'studentId e obrigatorio' });
    }
    if (!['entry', 'exit'].includes(type)) {
      return res.status(400).json({ error: 'ValidationError', message: 'type deve ser entry ou exit' });
    }
    const session = await sessionService.create(req.body);
    res.status(201).json({ data: session });
  } catch (err) {
    next(err);
  }
}

module.exports = { index, lastByStudent, create };
