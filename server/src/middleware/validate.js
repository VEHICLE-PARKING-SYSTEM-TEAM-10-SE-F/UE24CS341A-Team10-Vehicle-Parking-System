const AppError = require('../utils/AppError');

// SRS SEC-05: reject input containing database operators or script content.
const SCRIPT_PATTERN = /<\s*\/?\s*script\b|javascript:|\bon\w+\s*=|<[^>]*>/i;

// Passwords are never displayed or used in queries as operators, so they may contain any characters.
const FREE_TEXT_KEYS = new Set(['password']);

function findUnsafe(value, path = '') {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const hit = findUnsafe(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key;
      if (key.startsWith('$') || key.includes('.')) return childPath;
      if (FREE_TEXT_KEYS.has(key) && typeof inner === 'string') continue;
      const hit = findUnsafe(inner, childPath);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof value === 'string' && SCRIPT_PATTERN.test(value)) return path || 'value';
  return null;
}

function rejectUnsafeInput(req, res, next) {
  const field = findUnsafe(req.body) || findUnsafe(req.query) || findUnsafe(req.params);
  if (field) {
    return next(new AppError(400, 'VALIDATION_ERROR', 'Input contains characters that are not allowed', field));
  }
  return next();
}

// SEC-05: validate type, length and format with a Joi schema. Unknown fields are rejected.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: true, convert: true });
    if (error) {
      const detail = error.details[0];
      const field = detail.path.join('.') || null;
      return next(new AppError(400, 'VALIDATION_ERROR', detail.message.replace(/"/g, ''), field));
    }
    if (source === 'body') req.body = value;
    else req.validated = value;
    return next();
  };
}

module.exports = { rejectUnsafeInput, validate, findUnsafe };
