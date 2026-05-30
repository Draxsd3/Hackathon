const { Router } = require('express');
const controller = require('../controllers/loans.controller');
const { validate } = require('../middlewares/validate.middleware');

const router = Router();

const validateCreate = validate((req) => {
  const errors = [];
  if (!req.body.studentId) errors.push('studentId e obrigatorio');
  if (!req.body.bookId) errors.push('bookId e obrigatorio');
  return errors;
});

router.get('/', controller.index);
router.post('/refresh-overdue', controller.refreshOverdue);
router.get('/:id', controller.show);
router.post('/', validateCreate, controller.create);
router.post('/:id/return', controller.returnLoan);

module.exports = router;
