const { Router } = require('express');
const controller = require('../controllers/books.controller');
const { validate } = require('../middlewares/validate.middleware');

const router = Router();

const validateCreate = validate((req) => {
  const errors = [];
  if (!req.body.title) errors.push('title e obrigatorio');
  if (!req.body.author) errors.push('author e obrigatorio');
  return errors;
});

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', validateCreate, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
