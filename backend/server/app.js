const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { CONFIG } = require("./config");
const attachRoutes = require("./routes");
const { apiLimiter } = require("../middleware/rate/rateLimiter.middleware");
const { errorHandler, notFound } = require("../middleware");
const logger = require("../utils/logging/logger");
const roleRoutes = require("../routes/role/roleRoutes");
const permissionRoutes = require("../routes/role/permissionRoutes");

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_ROOT)) {
    fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
    logger.info(`Created uploads directory: ${UPLOADS_ROOT}`);
  }
}

function parseAllowedOrigins() {
  const rawOrigins = process.env.ALLOWED_ORIGINS || "";
  const origins = rawOrigins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (CONFIG.IS_PRODUCTION && origins.length === 0) {
    throw new Error(
      "ALLOWED_ORIGINS environment variable is required in production"
    );
  }

  if (origins.includes("*") && CONFIG.IS_PRODUCTION) {
    throw new Error(
      "Wildcard (*) origin is not allowed in production with credentials"
    );
  }

  return origins;
}

function configureCors() {
  const allowedOrigins = parseAllowedOrigins();

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(
        new Error(`Origin ${origin} is not allowed by CORS policy`)
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
    maxAge: 86400,
    optionsSuccessStatus: 204,
  };
}

function configureHelmet() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        fontSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: CONFIG.IS_PRODUCTION ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: CONFIG.IS_PRODUCTION
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  };
}

function attachRequestId(req, res, next) {
  const requestId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  req.id = `req_${requestId}`;
  res.setHeader("X-Request-Id", req.id);
  next();
}

function attachRequestTimeout(req, res, next) {
  const timeout = CONFIG.REQUEST_TIMEOUT || 30000;

  req.setTimeout(timeout, () => {
    logger.error(`Request timeout: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: "Request timeout",
        code: "REQUEST_TIMEOUT",
        requestId: req.id,
      });
    }
  });
  next();
}

function monitorSlowRequests(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const slowThreshold = 3000;
    const criticalThreshold = 5000;

    if (duration > criticalThreshold) {
      logger.error(
        `Critical slow request: ${req.method} ${req.originalUrl} - ${duration}ms`,
        { requestId: req.id, duration, method: req.method, url: req.originalUrl }
      );
    } else if (duration > slowThreshold) {
      logger.warn(
        `Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`,
        { requestId: req.id, duration }
      );
    }
  });

  next();
}

function trimRequestBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
}

function configureLogger() {
  if (CONFIG.IS_DEVELOPMENT) {
    return morgan("dev");
  }

  return morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
    skip: (req) => req.url === "/api/health" || req.url === "/",
  });
}

function setupStaticUploads(app) {
  ensureUploadsDir();

  const staticOptions = {
    maxAge: CONFIG.IS_PRODUCTION ? CONFIG.CACHE_MAX_AGE || 86400000 : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (!CONFIG.IS_PRODUCTION) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  };

  app.use("/uploads", express.static(UPLOADS_ROOT, staticOptions));
  logger.info(`Static uploads directory mounted at /uploads`);
}

function registerHealthChecks(app) {
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Backend API is running",
      service: "Complaint Management System",
      version: CONFIG.API_VERSION || "1.0.0",
      environment: CONFIG.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.head("/", (req, res) => res.status(200).end());

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      status: "healthy",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  });
}

function registerRoutes(app) {
  app.use("/api", apiLimiter);
  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  attachRoutes(app);
}

function buildExpressApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.set("etag", false);
  app.set("json spaces", CONFIG.IS_PRODUCTION ? 0 : 2);

  app.use(helmet(configureHelmet()));
  app.use(cors(configureCors()));
  app.options("*", cors(configureCors()));

  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: CONFIG.COMPRESSION_LEVEL || 6,
      threshold: 1024,
    })
  );

  const jsonLimit = CONFIG.MAX_FILE_SIZE || "10mb";
  app.use(express.json({ limit: jsonLimit }));
  app.use(express.urlencoded({ limit: jsonLimit, extended: true }));

  app.use(configureLogger());
  app.use(attachRequestId);
  app.use(attachRequestTimeout);
  app.use(monitorSlowRequests);
  app.use(trimRequestBody);

  setupStaticUploads(app);
  registerHealthChecks(app);
  registerRoutes(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildExpressApp;
module.exports.UPLOADS_ROOT = UPLOADS_ROOT;
