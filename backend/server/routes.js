const express = require("express");

const authRoutes = require("../routes/auth/auth.routes");
const usersRoutes = require("../routes/users/users.routes");
const complaintsRoutes = require("../routes/complaints/complaints.routes");
const reportsRoutes = require("../routes/reports/reports.routes");

// IMPORTANT: fix this import to your real admin router file
// const adminRoutes = require("../routes/admin/admin.routes");
const logger = require("../utils/logging/logger");

const SERVICE_NAME = "Complaint Management System API";
const SERVICE_VERSION = "2.0.0";

function mapMongooseReadyState(state) {
  // Mongoose: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting. [web:68]
  switch (state) {
    case 1:
      return { code: 1, label: "connected", ok: true };
    case 2:
      return { code: 2, label: "connecting", ok: false };
    case 3:
      return { code: 3, label: "disconnecting", ok: false };
    case 0:
    default:
      return { code: 0, label: "disconnected", ok: false };
  }
}

function buildPublicWsUrl({ baseUrl, req }) {
  // Prefer explicit env config (best for production behind proxies / TLS termination). [web:60]
  if (process.env.WS_PUBLIC_URL) return process.env.WS_PUBLIC_URL;

  // Fallback: derive from BASE_URL (http->ws, https->wss).
  if (baseUrl) {
    const wsBase = baseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    return `${wsBase}/ws/complaints`;
  }

  // Final fallback: derive from the current request (works in many deployments). [web:60]
  const proto =
    req?.headers["x-forwarded-proto"] || (req?.secure ? "https" : "http");
  const wsProto = proto === "https" ? "wss" : "ws";
  const host = req?.get("host");
  return host ? `${wsProto}://${host}/ws/complaints` : null;
}

// Attach health, version, system and API routers
function attachRoutes(app, deps = {}) {
  const { CONFIG, fs, mongoose } = deps;

  const router = express.Router();

  // Root info (use router so it’s easier to version later). [web:60]
  router.get("/", (req, res) => {
    const wsUrl = buildPublicWsUrl({ baseUrl: CONFIG?.BASE_URL, req });

    res.status(200).json({
      success: true,
      name: SERVICE_NAME,
      version: SERVICE_VERSION,
      status: "operational",
      environment: CONFIG?.NODE_ENV,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: "/api/health",
        live: "/api/live",
        ready: "/api/ready",
        version: "/api/version",
        auth: "/api/auth",
        users: "/api/users",
        complaints: "/api/complaints",
        reports: "/api/reports",
        // admin: "/api/admin",
      },
      websocket: wsUrl,
    });
  });

  // Liveness: “process is up” (good for container liveness probes). [web:64]
  router.get("/api/live", (_req, res) => {
    res.status(200).json({
      success: true,
      status: "alive",
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness: “can serve traffic” (typically checks DB connection). [web:64]
  router.get("/api/ready", (_req, res) => {
    const state = mapMongooseReadyState(mongoose?.connection?.readyState);
    const ok = state.ok;

    res.status(ok ? 200 : 503).json({
      success: ok,
      status: ok ? "ready" : "not_ready",
      database: state,
      timestamp: new Date().toISOString(),
    });
  });

  // Health: includes extra diagnostics + response time (keep it lightweight). [web:62][web:63]
  router.get("/api/health", (_req, res) => {
    const start = Date.now();

    const dbState = mapMongooseReadyState(mongoose?.connection?.readyState);

    const storage =
      CONFIG?.UPLOAD_DIRS && fs
        ? {
            avatars:
              !!CONFIG.UPLOAD_DIRS.AVATARS &&
              fs.existsSync(CONFIG.UPLOAD_DIRS.AVATARS),
            covers:
              !!CONFIG.UPLOAD_DIRS.COVERS &&
              fs.existsSync(CONFIG.UPLOAD_DIRS.COVERS),
            complaints:
              !!CONFIG.UPLOAD_DIRS.COMPLAINTS &&
              fs.existsSync(CONFIG.UPLOAD_DIRS.COMPLAINTS),
          }
        : undefined;

    const ok = dbState.ok;

    res.status(ok ? 200 : 503).json({
      success: ok,
      status: ok ? "healthy" : "degraded",
      environment: CONFIG?.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      },
      database: dbState,
      storage,
      responseTimeMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  });

  // Version (stable info; avoid “buildDate = now”). [web:60]
  router.get("/api/version", (_req, res) => {
    res.status(200).json({
      success: true,
      serviceVersion: SERVICE_VERSION,
      apiVersion: CONFIG?.API_VERSION,
      node: process.version,
      limits: {
        maxFileSize: CONFIG?.MAX_FILE_SIZE,
        maxUploadFiles: CONFIG?.MAX_UPLOAD_FILES,
        requestTimeoutMs: CONFIG?.REQUEST_TIMEOUT,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Lightweight system stats (avoid exposing too much externally if public). [web:67]
  router.get("/api/system/stats", (_req, res) => {
    res.status(200).json({
      success: true,
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        environment: CONFIG?.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      database: mapMongooseReadyState(mongoose?.connection?.readyState),
      timestamp: new Date().toISOString(),
    });
  });

  // API routers
  router.use("/api/auth", authRoutes);
  router.use("/api/users", usersRoutes);
  router.use("/api/complaints", complaintsRoutes);
  router.use("/api/reports", reportsRoutes);

  // If you actually have admin routes, mount them here (don’t reuse usersRoutes)
  // router.use("/api/admin", adminRoutes);

  app.use("/", router);

  logger.info("✅ Routes mounted");
}

module.exports = attachRoutes;
