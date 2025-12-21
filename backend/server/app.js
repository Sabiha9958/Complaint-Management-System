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
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

function parseCsvEnv(name) {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildAllowedOrigins() {
  const allowed = parseCsvEnv("ALLOWED_ORIGINS");

  // In production, fail fast if you forgot to configure CORS.
  if (CONFIG.IS_PRODUCTION && allowed.length === 0) {
    throw new Error(
      "ALLOWED_ORIGINS is required in production (comma-separated list of allowed origins)"
    );
  }

  // Note: If you use cookies (credentials: true), do NOT use "*" (not compatible).
  if (allowed.includes("*")) {
    logger.warn("ALLOWED_ORIGINS contains '*'. This is unsafe for auth APIs.");
  }

  return allowed;
}

function createCorsOptions() {
  const allowed = buildAllowedOrigins();

  return {
    origin: (origin, cb) => {
      // Non-browser clients often send no Origin header.
      if (!origin) return cb(null, true);

      // If you really want wildcard support, keep it explicit.
      if (allowed.includes("*")) return cb(null, true);

      if (allowed.includes(origin)) return cb(null, true);

      logger.warn(`CORS blocked: ${origin}`);
      return cb(new Error(`CORS policy violation: ${origin} not allowed`));
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
  };
}

function createHelmetOptions() {
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
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: CONFIG.IS_PRODUCTION
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  };
}

function requestId() {
  return (req, res, next) => {
    const rid =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    req.id = `req_${rid}`;
    res.setHeader("X-Request-Id", req.id);
    next();
  };
}

function requestTimeout() {
  return (req, res, next) => {
    req.setTimeout(CONFIG.REQUEST_TIMEOUT, () => {
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
  };
}

function slowRequestMonitor() {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      if (ms > 5000)
        logger.error(`Very slow: ${req.method} ${req.originalUrl} - ${ms}ms`);
      else if (ms > 3000)
        logger.warn(`Slow: ${req.method} ${req.originalUrl} - ${ms}ms`);
    });
    next();
  };
}

function trimBodyStrings() {
  return (req, _res, next) => {
    if (!req.body || typeof req.body !== "object") return next();
    for (const k of Object.keys(req.body)) {
      if (typeof req.body[k] === "string") req.body[k] = req.body[k].trim();
    }
    next();
  };
}

function httpLogger() {
  if (CONFIG.IS_DEVELOPMENT) return morgan("dev");
  return morgan("combined", {
    stream: logger.stream,
    skip: (req) => req.url === "/api/health" || req.url === "/",
  });
}

function mountUploads(app) {
  ensureUploadsDir();
  app.use(
    "/uploads",
    express.static(UPLOADS_ROOT, {
      maxAge: CONFIG.IS_PRODUCTION ? CONFIG.CACHE_MAX_AGE : 0,
      etag: true,
      lastModified: true,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (!CONFIG.IS_PRODUCTION) res.setHeader("Cache-Control", "no-store");
      },
    })
  );
}

function buildExpressApp() {
  const app = express();

  // Keep this only if you're actually behind a reverse proxy (Nginx/Render/Heroku/etc).
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.set("etag", false);

  app.use(helmet(createHelmetOptions()));
  app.use(cors(createCorsOptions()));

  app.use(
    compression({
      filter: (req, res) =>
        req.headers["x-no-compression"] ? false : compression.filter(req, res),
      level: CONFIG.COMPRESSION_LEVEL,
      threshold: 1024,
    })
  );

  app.use(express.json({ limit: CONFIG.MAX_FILE_SIZE }));
  app.use(express.urlencoded({ limit: CONFIG.MAX_FILE_SIZE, extended: true }));

  app.use(httpLogger());
  app.use(requestId());
  app.use(requestTimeout());
  app.use(slowRequestMonitor());
  app.use(trimBodyStrings());

  mountUploads(app);

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Backend API is running",
      service: "Complaint Management System",
      version: CONFIG.API_VERSION,
      environment: CONFIG.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.head("/", (_req, res) => res.status(200).end());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "API is healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api", apiLimiter);

  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  attachRoutes(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = buildExpressApp;
module.exports.UPLOADS_ROOT = UPLOADS_ROOT;
