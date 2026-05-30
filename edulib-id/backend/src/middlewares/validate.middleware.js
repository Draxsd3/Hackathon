/**
 * Middleware simples de validacao. Recebe um validador (req) => string[] de erros.
 * Em uma evolucao futura, considere zod ou joi.
 */
function validate(validator) {
  return (req, res, next) => {
    const errors = validator(req) || [];
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Dados invalidos',
        details: errors,
      });
    }
    next();
  };
}

module.exports = { validate };
