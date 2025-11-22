/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */

const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter
 */
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

/**
 * Stricter limiter for authentication routes
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message:
      "Too many login attempts from this IP, please try again after 15 minutes.",
  },
});

/**
 * Limiter for complaint creation
 */
exports.complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 complaints per hour
  message: {
    success: false,
    message: "Too many complaints submitted. Please try again later.",
  },
});
