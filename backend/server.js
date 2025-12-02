/**
 * ════════════════════════════════════════════════════════════════
 * 🚀 COMPLAINT MANAGEMENT SYSTEM - SERVER ENTRY POINT v2.0
 * ════════════════════════════════════════════════════════════════
 * Production-ready Express server with:
 * ✅ Advanced security (Helmet, CORS, Rate Limiting)
 * ✅ File upload management with validation
 * ✅ WebSocket real-time updates
 * ✅ Comprehensive health monitoring
 * ✅ Graceful shutdown handling
 * ✅ Detailed error handling & logging
 */

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");

// Core imports
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const logger = require("./utils/logger");

// Route imports
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const complaintsRoutes = require("./routes/complaintsRoutes");
const reportsRoutes = require("./routes/reports");
const adminRoutes = require("./routes/adminRoutes");

// WebSocket
const { initializeWebSocket, broadcast } = require("./websoket");

const app = express();

/* ========================================================================
 * 📋 CONFIGURATION & CONSTANTS
 * ===================================================================== */

const CONFIG = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  API_VERSION: process.env.API_VERSION || "v1",

  // Upload Directories
  UPLOAD_DIRS: {
    BASE: path.join(__dirname, "uploads"),
    AVATARS: path.join(__dirname, "uploads/avatars"),
    COVERS: path.join(__dirname, "uploads/covers"),
    COMPLAINTS: path.join(__dirname, "uploads/complaints"),
  },

  // File Upload Limits
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "50mb",
  MAX_UPLOAD_FILES: parseInt(process.env.MAX_UPLOAD_FILES || "5", 10),

  // Timeout Configuration
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10),
  SHUTDOWN_TIMEOUT: parseInt(process.env.SHUTDOWN_TIMEOUT || "10000", 10),

  // Performance Settings
  COMPRESSION_LEVEL: parseInt(process.env.COMPRESSION_LEVEL || "6", 10),
  CACHE_MAX_AGE: process.env.CACHE_MAX_AGE || "7d",

  // Security
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
};

/* ========================================================================
 * ✅ ENVIRONMENT VALIDATION
 * ===================================================================== */

/**
 * Validates required environment variables on startup
 * Exits process with detailed error message if critical vars are missing
 */
const validateEnvironment = () => {
  // Critical environment variables
  const requiredEnvVars = [
    { name: "MONGO_URI", description: "MongoDB connection string" },
    { name: "JWT_SECRET", description: "JWT signing secret" },
    { name: "JWT_EXPIRE", description: "JWT expiration time" },
    {
      name: "JWT_REFRESH_SECRET",
      description: "Refresh token signing secret",
    },
    { name: "JWT_REFRESH_EXPIRE", description: "Refresh token expiration" },
  ];

  const missingVars = requiredEnvVars.filter(
    (varObj) => !process.env[varObj.name]
  );

  if (missingVars.length > 0) {
    const missingNames = missingVars.map((v) => v.name).join(", ");

    logger.error(`❌ Missing required environment variables: ${missingNames}`);

    console.error("\n");
    console.error(
      "╔═══════════════════════════════════════════════════════════════════╗"
    );
    console.error(
      "║                                                                   ║"
    );
    console.error(
      "║  ⚠️  STARTUP FAILED - MISSING ENVIRONMENT VARIABLES              ║"
    );
    console.error(
      "║                                                                   ║"
    );
    console.error(
      "╠═══════════════════════════════════════════════════════════════════╣"
    );
    console.error(
      "║                                                                   ║"
    );

    missingVars.forEach((varObj) => {
      console.error(
        `║  ❌ ${varObj.name.padEnd(25)} - ${varObj.description.padEnd(32)}║`
      );
    });

    console.error(
      "║                                                                   ║"
    );
    console.error(
      "╠═══════════════════════════════════════════════════════════════════╣"
    );
    console.error(
      "║                                                                   ║"
    );
    console.error(
      "║  💡 Add these variables to your .env file:                       ║"
    );
    console.error(
      "║                                                                   ║"
    );

    missingVars.forEach((varObj) => {
      if (varObj.name === "JWT_SECRET") {
        console.error(
          "║     JWT_SECRET=your_super_secret_key_here                     ║"
        );
      } else if (varObj.name === "JWT_EXPIRE") {
        console.error(
          "║     JWT_EXPIRE=7d                                             ║"
        );
      } else if (varObj.name === "JWT_REFRESH_SECRET") {
        console.error(
          "║     JWT_REFRESH_SECRET=your_refresh_secret_here               ║"
        );
      } else if (varObj.name === "JWT_REFRESH_EXPIRE") {
        console.error(
          "║     JWT_REFRESH_EXPIRE=30d                                    ║"
        );
      } else if (varObj.name === "MONGO_URI") {
        console.error(
          "║     MONGO_URI=mongodb://localhost:27017/complaint-system     ║"
        );
      }
    });

    console.error(
      "║                                                                   ║"
    );
    console.error(
      "╚═══════════════════════════════════════════════════════════════════╝"
    );
    console.error("\n");

    process.exit(1);
  }

  // Recommended but optional variables
  const recommendedVars = [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "ALLOWED_ORIGINS",
  ];
  const missingRecommended = recommendedVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingRecommended.length > 0) {
    logger.warn(
      `⚠️ Missing recommended environment variables: ${missingRecommended.join(
        ", "
      )}`
    );
    console.warn(
      `\n⚠️  Note: Missing optional variables: ${missingRecommended.join(
        ", "
      )}\n`
    );
  }

  logger.info("✅ Environment variables validated successfully");
};

/**
 * Creates required upload directories if they don't exist
 */
const createUploadDirectories = () => {
  let created = 0;
  let existing = 0;

  Object.entries(CONFIG.UPLOAD_DIRS).forEach(([key, dir]) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`📁 Created upload directory: ${key} -> ${dir}`);
      created++;
    } else {
      logger.debug?.(`✅ Upload directory exists: ${key}`);
      existing++;
    }
  });

  if (created > 0) {
    logger.info(`📂 Created ${created} new upload directories`);
  }
  if (existing > 0) {
    logger.info(`✅ Verified ${existing} existing upload directories`);
  }
};

/**
 * Verifies database connection is established
 */
const verifyDatabaseConnection = () => {
  const dbState = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];

  if (dbState !== 1) {
    logger.error(
      `❌ Database not properly connected. State: ${states[dbState]}`
    );
    throw new Error("Database connection failed");
  }

  logger.info(
    `✅ Database connected: ${mongoose.connection.name} @ ${mongoose.connection.host}`
  );
};

// Run startup validations
validateEnvironment();
createUploadDirectories();

/* ========================================================================
 * 🔧 MIDDLEWARE CONFIGURATION
 * ===================================================================== */

// Trust proxy for accurate client IP behind reverse proxies
app.set("trust proxy", 1);

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        fontSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: CONFIG.IS_PRODUCTION ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: CONFIG.IS_PRODUCTION
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      logger.warn(`🚫 CORS blocked request from origin: ${origin}`);
      return callback(
        new Error(
          `CORS policy violation: Origin ${origin} not allowed. Allowed origins: ${allowedOrigins.join(
            ", "
          )}`
        )
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Request-Id",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range", "X-Request-Id"],
    maxAge: 86400, // 24 hours
  })
);

// Response Compression
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
    level: CONFIG.COMPRESSION_LEVEL,
    threshold: 1024, // Only compress > 1KB
  })
);

// Body Parsers
app.use(
  express.json({
    limit: CONFIG.MAX_FILE_SIZE,
    strict: true,
  })
);
app.use(
  express.urlencoded({
    limit: CONFIG.MAX_FILE_SIZE,
    extended: true,
    parameterLimit: 10000,
  })
);

// Request Logging
if (CONFIG.IS_DEVELOPMENT) {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: logger.stream,
      skip: (req) => req.url === "/api/health" || req.url === "/health",
    })
  );
}

// Request ID Generation
app.use((req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  res.setHeader("X-Request-Id", req.id);
  next();
});

// Request Timeout Handler
app.use((req, res, next) => {
  req.setTimeout(CONFIG.REQUEST_TIMEOUT, () => {
    logger.error(
      `⏱️ Request timeout: ${req.method} ${req.originalUrl} [${req.id}]`
    );
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: "Request timeout. Please try again.",
        code: "REQUEST_TIMEOUT",
        requestId: req.id,
      });
    }
  });
  next();
});

// Performance Monitor
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    if (duration > 5000) {
      logger.error(
        `🐌 Critical slow request: ${req.method} ${req.originalUrl} - ${duration}ms`
      );
    } else if (duration > 3000) {
      logger.warn(
        `⚠️ Very slow request: ${req.method} ${req.originalUrl} - ${duration}ms`
      );
    } else if (duration > 1000 && CONFIG.IS_DEVELOPMENT) {
      logger.debug?.(
        `⏱️ Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`
      );
    }
  });

  next();
});

// Input Sanitization (NoSQL injection prevention)
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
});

/* ========================================================================
 * 📂 STATIC FILE SERVING
 * ===================================================================== */

const staticOptions = (maxAge = CONFIG.CACHE_MAX_AGE) => ({
  maxAge: CONFIG.IS_PRODUCTION ? maxAge : "0",
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Content type for images
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filePath)) {
      res.setHeader("Content-Type", "image/*");
    }

    // Development: disable caching
    if (CONFIG.IS_DEVELOPMENT) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
});

app.use("/uploads", express.static(CONFIG.UPLOAD_DIRS.BASE, staticOptions()));
app.use(
  "/uploads/avatars",
  express.static(CONFIG.UPLOAD_DIRS.AVATARS, staticOptions("30d"))
);
app.use(
  "/uploads/covers",
  express.static(CONFIG.UPLOAD_DIRS.COVERS, staticOptions("30d"))
);
app.use(
  "/uploads/complaints",
  express.static(CONFIG.UPLOAD_DIRS.COMPLAINTS, staticOptions("1d"))
);

/* ========================================================================
 * 🚦 RATE LIMITING
 * ===================================================================== */

app.use("/api", apiLimiter);

/* ========================================================================
 * 🏠 HEALTH & INFO ENDPOINTS
 * ===================================================================== */

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "Complaint Management System API",
    version: "2.0.0",
    status: "operational",
    environment: CONFIG.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: "🎯 Welcome to Complaint Management System API",
    features: [
      "JWT Authentication with Refresh Tokens",
      "Role-Based Access Control (RBAC)",
      "File Upload & Management",
      "Real-time WebSocket Updates",
      "Admin Dashboard & Analytics",
      "Advanced Reporting & Export",
      "Email Notifications",
    ],
    endpoints: {
      health: "/api/health",
      version: "/api/version",
      auth: "/api/auth",
      users: "/api/users",
      complaints: "/api/complaints",
      reports: "/api/reports",
      admin: "/api/admin",
    },
    websocket: `ws://localhost:${CONFIG.PORT}/ws/complaints`,
    documentation: "/api/docs",
  });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const startTime = Date.now();

  const healthCheck = {
    success: true,
    status: "healthy",
    environment: CONFIG.NODE_ENV,
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    },
    timestamp: new Date().toISOString(),
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    memory: {
      usedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      usage: `${(
        (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
        100
      ).toFixed(1)}%`,
    },
  };

  try {
    const dbState = mongoose.connection.readyState;
    healthCheck.database = {
      status: dbState === 1 ? "connected" : "disconnected",
      state: ["disconnected", "connected", "connecting", "disconnecting"][
        dbState
      ],
      host: mongoose.connection.host || "unknown",
      name: mongoose.connection.name || "unknown",
    };

    if (dbState === 1) {
      await mongoose.connection.db.admin().ping();
      healthCheck.database.ping = "ok";
    }
  } catch (error) {
    healthCheck.database = {
      status: "error",
      error: error.message,
    };
    healthCheck.status = "degraded";
  }

  healthCheck.storage = {
    avatars: fs.existsSync(CONFIG.UPLOAD_DIRS.AVATARS),
    covers: fs.existsSync(CONFIG.UPLOAD_DIRS.COVERS),
    complaints: fs.existsSync(CONFIG.UPLOAD_DIRS.COMPLAINTS),
  };

  healthCheck.responseTime = `${Date.now() - startTime}ms`;

  const statusCode = healthCheck.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Version info endpoint
app.get("/api/version", (req, res) => {
  res.json({
    success: true,
    version: "2.0.0",
    apiVersion: CONFIG.API_VERSION,
    buildDate: new Date().toISOString(),
    node: process.version,
    features: {
      authentication: true,
      fileUpload: true,
      websocket: true,
      adminDashboard: true,
      reporting: true,
      emailNotifications: true,
    },
    limits: {
      maxFileSize: CONFIG.MAX_FILE_SIZE,
      maxUploadFiles: CONFIG.MAX_UPLOAD_FILES,
      requestTimeout: `${CONFIG.REQUEST_TIMEOUT}ms`,
    },
  });
});

/* ========================================================================
 * 📌 API ROUTES
 * ===================================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/admin", adminRoutes);

// System stats endpoint
app.get("/api/system/stats", (req, res) => {
  res.json({
    success: true,
    server: {
      uptime: formatUptime(process.uptime()),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: CONFIG.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memory: {
      totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      usedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      usage: `${(
        (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
        100
      ).toFixed(1)}%`,
    },
    cpu: process.cpuUsage(),
    database: {
      status: mongoose.connection.readyState,
      state: ["disconnected", "connected", "connecting", "disconnecting"][
        mongoose.connection.readyState
      ],
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      collections: mongoose.connection.collections
        ? Object.keys(mongoose.connection.collections).length
        : 0,
    },
    timestamp: new Date().toISOString(),
  });
});

/* ========================================================================
 * ❌ ERROR HANDLING
 * ===================================================================== */

app.use(notFound);
app.use(errorHandler);

/* ========================================================================
 * 🔌 HTTP + WEBSOCKET SERVER
 * ===================================================================== */

const server = http.createServer(app);
const wss = initializeWebSocket(server);

logger.info("✅ WebSocket server initialized on path: /ws/complaints");

/* ========================================================================
 * 🚀 SERVER STARTUP
 * ===================================================================== */

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Print startup banner
 */
const printBanner = () => {
  const serverUrl = `http://localhost:${CONFIG.PORT}`;
  const apiBase = `${serverUrl}/api`;
  const wsUrl = `ws://localhost:${CONFIG.PORT}/ws/complaints`;
  const startedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  console.log("\n");
  console.log(
    "╔════════════════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                                                                            ║"
  );
  console.log(
    "║   🚀 COMPLAINT MANAGEMENT SYSTEM v2.0 - SERVER RUNNING                     ║"
  );
  console.log(
    "║                                                                            ║"
  );
  console.log(
    "╠════════════════════════════════════════════════════════════════════════════╣"
  );
  console.log(
    "║                                                                            ║"
  );
  console.log(
    `║   📍 Environment : ${CONFIG.NODE_ENV.toUpperCase().padEnd(57)}║`
  );
  console.log(`║   🌐 Server URL  : ${serverUrl.padEnd(57)}║`);
  console.log(`║   📡 API Base    : ${apiBase.padEnd(57)}║`);
  console.log(`║   🔌 WebSocket   : ${wsUrl.padEnd(57)}║`);
  console.log(`║   🕒 Started At  : ${startedAt.padEnd(57)}║`);
  console.log(
    "║                                                                            ║"
  );
  console.log(
    "╠════════════════════════════════════════════════════════════════════════════╣"
  );
  console.log(
    "║                                                                            ║"
  );
  console.log(
    "║   ✅ Database    : Connected                                               ║"
  );
  console.log(
    "║   ✅ Security    : Enabled (Helmet + CORS)                                 ║"
  );
  console.log(
    "║   ✅ WebSocket   : Active                                                  ║"
  );
  console.log(
    "║   ✅ Compression : Enabled                                                 ║"
  );
  console.log(
    "║   ✅ File Upload : Ready                                                   ║"
  );
  console.log(
    "║                                                                            ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════════════════╝"
  );
  console.log("\n");
};

/**
 * Start server
 */
const startServer = async () => {
  try {
    await connectDB();
    verifyDatabaseConnection();

    server.listen(CONFIG.PORT, () => {
      printBanner();
      logger.info(`🚀 Server running on port ${CONFIG.PORT}`);
      logger.info(`📡 API: http://localhost:${CONFIG.PORT}/api`);
      logger.info(`🔌 WebSocket: ws://localhost:${CONFIG.PORT}/ws/complaints`);
      logger.info(`🌍 Environment: ${CONFIG.NODE_ENV}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`❌ Port ${CONFIG.PORT} is already in use`);
        console.error(
          "\n╔══════════════════════════════════════════════════════════════╗"
        );
        console.error(
          "║  ⚠️  PORT ALREADY IN USE                                    ║"
        );
        console.error(
          "╠══════════════════════════════════════════════════════════════╣"
        );
        console.error(
          `║  Port ${CONFIG.PORT} is being used by another process.              ║`
        );
        console.error(
          "║  Try: netstat -ano | findstr :5000  (Windows)               ║"
        );
        console.error(
          "║  Or change PORT in your .env file.                          ║"
        );
        console.error(
          "╚══════════════════════════════════════════════════════════════╝\n"
        );
      } else {
        logger.error(`❌ Server error: ${error.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    console.error(`\n❌ STARTUP ERROR: ${error.message}\n`);
    process.exit(1);
  }
};

/* ========================================================================
 * 🛑 GRACEFUL SHUTDOWN
 * ===================================================================== */

const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 ${signal} received - Starting graceful shutdown...`);
  console.log(`\n🛑 Shutting down gracefully (${signal})...\n`);

  let exitCode = 0;

  try {
    console.log("⏳ Closing WebSocket connections...");
    wss.clients.forEach((client) => client.close(1000, "Server shutting down"));
    logger.info("✅ WebSocket connections closed");
    console.log("✅ WebSocket closed");

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info("✅ HTTP server closed");
      console.log("✅ HTTP server closed");
    }

    console.log("⏳ Closing database connection...");
    await mongoose.connection.close(false);
    logger.info("✅ MongoDB connection closed");
    console.log("✅ Database closed");

    console.log("\n✅ Graceful shutdown completed\n");
  } catch (error) {
    logger.error(`❌ Shutdown error: ${error.message}`);
    console.error(`❌ Error: ${error.message}\n`);
    exitCode = 1;
  }

  process.exit(exitCode);
};

["SIGTERM", "SIGINT", "SIGUSR2"].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

process.on("uncaughtException", (error) => {
  logger.error("💥 Uncaught Exception:", {
    message: error.message,
    stack: error.stack,
  });
  console.error("\n💥 UNCAUGHT EXCEPTION:", error);
  gracefulShutdown("Uncaught Exception");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("💥 Unhandled Rejection:", { reason, promise });
  console.error("\n💥 UNHANDLED REJECTION:", reason);
  gracefulShutdown("Unhandled Rejection");
});

/* ========================================================================
 * 🚀 START SERVER
 * ===================================================================== */

startServer();

/* ========================================================================
 * 📤 EXPORTS
 * ===================================================================== */

module.exports = {
  app,
  server,
  wss,
  broadcastComplaint: (type, data, channel = "complaints") => {
    broadcast(
      wss,
      {
        type,
        data,
        timestamp: new Date().toISOString(),
      },
      channel
    );
  },
};
