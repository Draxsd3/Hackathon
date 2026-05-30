const loanService = require('../services/loan.service');

function index(req, res) {
  res.json({ data: loanService.list(req.query) });
}

function show(req, res) {
  const loan = loanService.findById(req.params.id);
  if (!loan) return res.status(404).json({ error: 'NotFound' });
  res.json({ data: loan });
}

function create(req, res, next) {
  try {
    const loan = loanService.create(req.body);
    res.status(201).json({ data: loan });
  } catch (err) {
    next(err);
  }
}

function returnLoan(req, res) {
  const loan = loanService.returnLoan(req.params.id);
  if (!loan) return res.status(404).json({ error: 'NotFound' });
  res.json({ data: loan });
}

module.exports = { index, show, create, returnLoan };
