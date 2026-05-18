const { logToServer } = require('./logger');

/**
 * Express middleware to capture and log HTTP requests to the centralized test server logs.
 */
function requestLoggingMiddleware(req, res, next) {
  const startTime = Date.now();

  // Listen to response finish event to capture complete status and duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logMessage = `HTTP ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`;

    // Map status code to level
    let level = 'info';
    if (res.statusCode >= 500) {
      level = 'error';
    } else if (res.statusCode >= 400) {
      level = 'warn';
    }

    // Determine package context based on path or method, default to controller
    let pkg = 'controller';
    if (req.originalUrl.includes('/cache')) {
      pkg = 'cache';
    } else if (req.originalUrl.includes('/db')) {
      pkg = 'db';
    }

    // Log request asynchronously in background
    logToServer(level, pkg, logMessage).catch((err) => {
      console.error('[Middleware Async Logging Error]:', err.message);
    });
  });

  next();
}

module.exports = requestLoggingMiddleware;
