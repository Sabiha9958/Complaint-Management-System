/**
 * ════════════════════════════════════════════════════════════════
 * 🚦 RATE LIMITER MIDDLEWARE
 * ════════════════════════════════════════════════════════════════
 * Protects API endpoints against abuse, brute-force attacks, and DDoS
 * Provides dynamic configuration, detailed logging, and Redis support
 */

const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// Optional Redis store for distributed rate limiting
let RedisStore;
let redisClient;

try {
  RedisStore = require("rate-limit-redis");
  const { createClient } = require("redis");

  if (process.env.REDIS_URL) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
      },
    });

    redisClient.on("error", (err) => {
      logger.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      logger.info("✅ Redis connected for rate limiting");
    });

    // Connect to Redis (don't await, let it connect in background)
    redisClient.connect().catch((err) => {
      logger.warn("Redis connection failed, using memory store:", err.message);
    });
  }
} catch (error) {
  logger.warn("Redis not available, using memory store for rate limiting");
}

// ════════════════════════════════════════════════════════════════
// 🏭 RATE LIMITER FACTORY
// ════════════════════════════════════════════════════════════════

/**
 * Factory to create customized rate limiters
 * @param {Object} options - configuration overrides
 * @returns {Function} Express middleware
 */
const createLimiter = ({
  windowMs = 15 * 60 * 1000, // default 15 minutes
  max = 100, // default 100 requests
  message = {
    success: false,
    statusCode: 429,
    error: "Too many requests. Please try again later.",
  },
  keyGenerator = (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?._id?.toString() || req.ip;
  },
  skip = () => false, // skip function to bypass limiter if needed
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
  handler, // optional custom handler
  standardHeaders = true,
  legacyHeaders = false,
  requestPropertyName = "rateLimit",
} = {}) => {
  const config = {
    windowMs,
    max,
    standardHeaders,
    legacyHeaders,
    message,
    keyGenerator,
    skip,
    skipSuccessfulRequests,
    skipFailedRequests,
    requestPropertyName,
    handler:
      handler ||
      ((req, res, next, options) => {
        const identifier = req.user?.email || req.ip;
        logger.warn(
          `🚨 Rate limit exceeded for ${identifier} on ${req.method} ${
            req.originalUrl
          } (limit: ${options.max}/${Math.floor(options.windowMs / 60000)}min)`
        );
        res.status(options.statusCode || 429).json(options.message);
      }),
  };

  // Add Redis store if available
  if (redisClient && redisClient.isOpen) {
    config.store = new RedisStore({
      client: redisClient,
      prefix: "rl:", // rate limit prefix
    });
  }

  return rateLimit(config);
};

// ════════════════════════════════════════════════════════════════
// 🔧 PREDEFINED RATE LIMITERS
// ════════════════════════════════════════════════════════════════

/**
 * 🌐 General API Rate Limiter
 * Applies to most endpoints
 * Default: 100 requests per 15 minutes
 */
const apiLimiter = createLimiter({
  windowMs: 50 * 60 * 1000, // 50 minutes
  max: Number(process.env.API_RATE_LIMIT) || 100,
  message: {
    success: false,
    statusCode: 429,
    error: "Too many requests from this IP. Please try again after 15 minutes.",
    retryAfter: "15 minutes",
  },
});

/**
 * 🔐 Authentication Rate Limiter
 * For login, register, and password reset requests
 * Default: 5 requests per 10 minutes
 */
const authLimiter = createLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: Number(process.env.AUTH_RATE_LIMIT) || 5,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    statusCode: 429,
    error:
      "Too many authentication attempts. Please try again after 10 minutes.",
    retryAfter: "10 minutes",
  },
});

/**
 * 🔒 Sensitive Operations Limiter
 * For password changes, email updates, account deletion
 * Default: 3 requests per 30 minutes
 */
const sensitiveLimiter = createLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: Number(process.env.SENSITIVE_RATE_LIMIT) || 3,
  message: {
    success: false,
    statusCode: 429,
    error:
      "Too many sensitive operations attempted. Please try again after 30 minutes.",
    retryAfter: "30 minutes",
  },
});

/**
 * 📤 Upload Rate Limiter
 * For file uploads (avatars, attachments, etc.)
 * Default: 10 uploads per hour
 */
const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: Number(process.env.UPLOAD_RATE_LIMIT) || 10,
  message: {
    success: false,
    statusCode: 429,
    error: "Upload limit exceeded. Please try again after 1 hour.",
    retryAfter: "1 hour",
    hint: "Maximum 10 file uploads per hour allowed.",
  },
  skipFailedRequests: true, // Don't count failed uploads
});

/**
 * 📧 Email Rate Limiter
 * For email sending operations (verification, notifications)
 * Default: 5 emails per hour
 */
const emailLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: Number(process.env.EMAIL_RATE_LIMIT) || 5,
  message: {
    success: false,
    statusCode: 429,
    error: "Too many email requests. Please try again after 1 hour.",
    retryAfter: "1 hour",
  },
});

/**
 * 🔍 Search Rate Limiter
 * For search and query operations
 * Default: 30 searches per 1 minute
 */
const searchLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: Number(process.env.SEARCH_RATE_LIMIT) || 30,
  message: {
    success: false,
    statusCode: 429,
    error: "Too many search requests. Please slow down.",
    retryAfter: "1 minute",
  },
});

/**
 * 📊 Report Generation Limiter
 * For heavy operations like report generation, exports
 * Default: 5 requests per 5 minutes
 */
const reportLimiter = createLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: Number(process.env.REPORT_RATE_LIMIT) || 5,
  message: {
    success: false,
    statusCode: 429,
    error: "Too many report requests. Please try again after 5 minutes.",
    retryAfter: "5 minutes",
  },
});

/**
 * 🚀 Strict Limiter (for critical operations)
 * Very restrictive for critical operations
 * Default: 2 requests per hour
 */
const strictLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: Number(process.env.STRICT_RATE_LIMIT) || 2,
  message: {
    success: false,
    statusCode: 429,
    error: "Critical operation limit exceeded. Please try again after 1 hour.",
    retryAfter: "1 hour",
  },
});

// ════════════════════════════════════════════════════════════════
// 🛡️ CUSTOM RATE LIMITER FOR IP-BASED PROTECTION
// ════════════════════════════════════════════════════════════════

/**
 * IP-based limiter (ignores authentication)
 * Useful for public endpoints
 */
const ipBasedLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  keyGenerator: (req) => req.ip, // Always use IP
  message: {
    success: false,
    statusCode: 429,
    error: "Too many requests from your IP address.",
    retryAfter: "15 minutes",
  },
});

// ════════════════════════════════════════════════════════════════
// 🧪 SKIP RATE LIMITING FOR CERTAIN CONDITIONS
// ════════════════════════════════════════════════════════════════

/**
 * Skip rate limiting for admin users (optional)
 */
const skipForAdmin = (req) => {
  return req.user && req.user.role === "admin";
};

/**
 * Skip rate limiting for localhost in development
 */
const skipForDevelopment = (req) => {
  return (
    process.env.NODE_ENV === "development" &&
    (req.ip === "::1" ||
      req.ip === "127.0.0.1" ||
      req.ip === "::ffff:127.0.0.1")
  );
};

// ════════════════════════════════════════════════════════════════
// 🧹 CLEANUP ON SHUTDOWN
// ════════════════════════════════════════════════════════════════

process.on("SIGTERM", async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info("Redis client closed");
  }
});

// ════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ════════════════════════════════════════════════════════════════

module.exports = {
  // Predefined limiters
  apiLimiter,
  authLimiter,
  sensitiveLimiter,
  uploadLimiter, // ✅ Added this!
  emailLimiter,
  searchLimiter,
  reportLimiter,
  strictLimiter,
  ipBasedLimiter,

  // Factory and utilities
  createLimiter,
  skipForAdmin,
  skipForDevelopment,
};
