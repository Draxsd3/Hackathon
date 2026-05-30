const { Router } = require('express');
const controller = require('../controllers/sessions.controller');

const router = Router();

router.get('/', controller.index);
router.get('/last/:studentId', controller.lastByStudent);
router.post('/', controller.create);

module.exports = router;
