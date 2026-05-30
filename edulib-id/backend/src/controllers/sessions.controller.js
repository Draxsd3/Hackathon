const sessionService = require('../services/session.service');
const studentService = require('../services/student.service');

function index(req, res) {
  res.json({ data: sessionService.list(req.query) });
}

function create(req, res) {
  const { studentId, type } = req.body;
  if (!studentService.findById(studentId)) {
    return res.status(404).json({ error: 'NotFound', message: 'Aluno nao encontrado' });
  }
  if (!['entry', 'exit'].includes(type)) {
    return res.status(400).json({ error: 'ValidationError', message: 'type deve ser entry ou exit' });
  }
  const session = sessionService.create(req.body);
  res.status(201).json({ data: session });
}

module.exports = { index, create };
