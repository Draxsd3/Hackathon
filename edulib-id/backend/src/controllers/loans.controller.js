const loanService = require('../services/loan.service');

async function index(req, res, next) {
  try {
    res.json({ data: await loanService.list(req.query) });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    const loan = await loanService.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: loan });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const loan = await loanService.create(req.body);
    res.status(201).json({ data: loan });
  } catch (err) {
    next(err);
  }
}

async function returnLoan(req, res, next) {
  try {
    const loan = await loanService.returnLoan(req.params.id);
    if (!loan) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: loan });
  } catch (err) {
    next(err);
  }
}

async function refreshOverdue(req, res, next) {
  try {
    const changed = await loanService.markOverdue();
    res.json({ changed });
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, create, returnLoan, refreshOverdue };
