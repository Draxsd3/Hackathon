const studentService = require('../services/student.service');

async function index(req, res, next) {
  try {
    const { search } = req.query;
    res.json({ data: await studentService.list({ search }) });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    const student = await studentService.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'NotFound', message: 'Aluno nao encontrado' });
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const exists = await studentService.findByRegistration(req.body.registration);
    if (exists) {
      return res.status(409).json({ error: 'Conflict', message: 'Matricula ja cadastrada' });
    }
    const student = await studentService.create(req.body);
    res.status(201).json({ data: student });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const student = await studentService.update(req.params.id, req.body);
    if (!student) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const ok = await studentService.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'NotFound' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, create, update, destroy };
