/**
 * Catches any request that matched no route and turns it into a JSON 404.
 *
 * Without this, Express returns its default HTML error page, which is
 * jarring for an API client expecting JSON on every response.
 *
 * Register this AFTER your routes but BEFORE errorHandler.
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;
