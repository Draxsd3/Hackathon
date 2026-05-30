const { Router } = require('express');
const controller = require('../controllers/door.controller');

const router = Router();

// Status da porta serial / Arduino
router.get('/status', controller.getStatus);

// Envia o comando 'A' para o Arduino abrir a fechadura
router.post('/open', controller.openDoor);

module.exports = router;
