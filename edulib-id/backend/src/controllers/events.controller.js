const eventService = require('../services/event.service');

async function index(req, res, next) {
  try {
    const { type, limit } = req.query;
    res.json({
      data: await eventService.list({ type, limit: limit ? Number(limit) : undefined }),
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const event = await eventService.create(req.body);
    res.status(201).json({ data: event });
  } catch (err) {
    next(err);
  }
}

module.exports = { index, create };
