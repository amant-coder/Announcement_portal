const rateLimit = require('express-rate-limit');

// Rate limiter for auth / sensitive routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth/admin requests per windowMs
  message: {
    success: false,
    error: 'Too many login/signup attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authRateLimiter,
  apiRateLimiter,
};
