const { Router } = require('express');
const controller = require('../controllers/students.controller');
const { validate } = require('../middlewares/validate.middleware');

const router = Router();

const validateCreate = validate((req) => {
  const errors = [];
  if (!req.body.name) errors.push('name e obrigatorio');
  if (!req.body.registration) errors.push('registration e obrigatorio');
  return errors;
});

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', validateCreate, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
