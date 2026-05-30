const { Router } = require('express');
const controller = require('../controllers/events.controller');

const router = Router();

router.get('/', controller.index);
router.post('/', controller.create);

module.exports = router;
