function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  let status =
    err.statusCode ||
    err.status ||
    500;

  let message =
    err.message ||
    'Internal server error';

  /*
   * Mongoose validation errors are caused by
   * invalid client input, so return 400.
   */
  if (
    err.name === 'ValidationError'
  ) {
    status = 400;
    message = 'Validation failed.';
  }

  /*
   * Mongoose invalid ObjectId.
   */
  if (
    err.name === 'CastError'
  ) {
    status = 400;
    message = 'Invalid resource ID.';
  }

  /*
   * Duplicate MongoDB unique field.
   */
  if (
    err.code === 11000
  ) {
    status = 409;
    message = 'A record with that value already exists.';
  }

  /*
   * Gemini quota / rate limit.
   */
  if (
    status === 429
  ) {
    message =
      'Gemini API rate limit or quota exceeded. Check your API usage and limits.';
  }

  /*
   * Authentication/configuration errors.
   */
  if (
    err.code === 'GEMINI_API_KEY_MISSING'
  ) {
    status = 503;
    message =
      'Gemini API key is not configured.';
  }

  res.status(status).json({
    success: false,
    code:
      err.code ||
      'INTERNAL_SERVER_ERROR',
    message,
  });
}

module.exports = {
  notFound,
  errorHandler,
};