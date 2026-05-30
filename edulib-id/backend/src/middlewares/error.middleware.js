const env = require('../config/env');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'NotFound',
    message: `Rota ${req.method} ${req.originalUrl} nao encontrada`,
  });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    error: err.name || 'InternalServerError',
    message: err.message || 'Erro inesperado',
  };

  if (!env.isProduction) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
