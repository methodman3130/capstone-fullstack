/**
 * Central error handler.
 *
 * Express identifies error middleware by its FOUR arguments (err, req, res, next).
 * Drop the `next` parameter and Express silently treats this as normal
 * middleware and your errors will never reach it.
 *
 * This must be registered AFTER all routes in server.js.
 */
function errorHandler(err, req, res, next) {
  // Keep the stack trace in the terminal - this is what you read while debugging.
  console.error(err);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';
  let errors;

  // Malformed ObjectId, e.g. GET /api/products/abc
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path} format: ${err.value}`;
  }

  // Mongoose schema validation failure (required, min, maxlength, custom validators)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join('. ');
  }

  // Duplicate key from a unique index
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`;
  }

  // Malformed JSON in the request body (a stray comma, a missing quote)
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    // Never leak a stack trace to clients in production.
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;
