const eventService = require('../services/event.service');

function index(req, res) {
  const { type, limit } = req.query;
  res.json({
    data: eventService.list({ type, limit: limit ? Number(limit) : undefined }),
  });
}

module.exports = { index };
