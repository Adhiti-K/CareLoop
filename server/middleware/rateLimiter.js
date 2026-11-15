/**
 * In-Memory Sliding Window Rate Limiter Middleware
 * Protects public endpoints (like QR passport verification) against brute force and DDoS.
 */
const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // Default 1 minute
  const maxRequests = options.maxRequests || 30; // Default 30 requests per minute
  const message = options.message || 'Too many verification requests from this IP. Please try again later.';

  const ipRequests = new Map();

  // Periodic cleanup of stale entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequests.entries()) {
      if (now - data.resetTime > windowMs) {
        ipRequests.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not prevent process exit during tests
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // Determine client IP
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let entry = ipRequests.get(clientIp);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
      ipRequests.set(clientIp, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        valid: false,
        message
      });
    }

    next();
  };
};

module.exports = {
  createRateLimiter
};
