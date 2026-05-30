const { Router } = require('express');
const students = require('./students.routes');
const books = require('./books.routes');
const sessions = require('./sessions.routes');
const loans = require('./loans.routes');
const events = require('./events.routes');
const database = require('../config/database');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'edulib-id-backend', timestamp: new Date().toISOString() });
});

router.get('/health/db', async (req, res, next) => {
  try {
    const result = await database.healthcheck();
    res.json({
      status: 'ok',
      database: 'connected',
      serverTime: result.server_time,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.use('/students', students);
router.use('/books', books);
router.use('/sessions', sessions);
router.use('/loans', loans);
router.use('/events', events);

module.exports = router;
