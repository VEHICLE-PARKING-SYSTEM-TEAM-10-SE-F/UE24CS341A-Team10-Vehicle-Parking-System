const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource does not exist'));
}

// Standard error body: { error: { code, message, field } } (SAD §4.4).
// Unexpected errors return a generic 500 - no stack traces or database details (SRS 3.3).
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, field: err.field } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON', field: null } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is too large', field: null } });
  }
  logger.error('Unhandled error', { path: req.path, message: err.message });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.', field: null } });
}

module.exports = { notFound, errorHandler };
