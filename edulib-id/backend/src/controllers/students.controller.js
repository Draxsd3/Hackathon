const studentService = require('../services/student.service');

function index(req, res) {
  const { search } = req.query;
  res.json({ data: studentService.list({ search }) });
}

function show(req, res) {
  const student = studentService.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'NotFound', message: 'Aluno nao encontrado' });
  res.json({ data: student });
}

function create(req, res) {
  const exists = studentService.findByRegistration(req.body.registration);
  if (exists) {
    return res.status(409).json({ error: 'Conflict', message: 'Matricula ja cadastrada' });
  }
  const student = studentService.create(req.body);
  res.status(201).json({ data: student });
}

function update(req, res) {
  const student = studentService.update(req.params.id, req.body);
  if (!student) return res.status(404).json({ error: 'NotFound' });
  res.json({ data: student });
}

function destroy(req, res) {
  const ok = studentService.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'NotFound' });
  res.status(204).send();
}

module.exports = { index, show, create, update, destroy };
