const connectDB = require("../config/db");
const logger = require("../utils/logging/logger");

const {
  CONFIG,
  validateEnvironment,
  createUploadDirectories,
} = require("./config");
const buildExpressApp = require("./app");
const createServerWithWebSocket = require("./websocket");
const gracefulShutdown = require("./shutdown");

function buildPublicUrls() {
  const httpBase =
    (CONFIG.BASE_URL && CONFIG.BASE_URL.trim()) ||
    `http://localhost:${CONFIG.PORT}`;

  const apiUrl = `${httpBase}/api`;

  // Prefer explicit WS public URL in production; fallback derives ws/wss from BASE_URL.
  const wsUrl =
    (process.env.WS_PUBLIC_URL && process.env.WS_PUBLIC_URL.trim()) ||
    `${httpBase
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:")}/ws/complaints`;

  return { httpBase, apiUrl, wsUrl };
}

async function startServer() {
  // 1) Validate + setup (fail fast)
  validateEnvironment();
  createUploadDirectories();

  // 2) Build app + server (but don't listen yet)
  const app = buildExpressApp();
  const { server, wss, broadcastComplaint } = createServerWithWebSocket(app);

  // 3) Single shutdown function (guarded)
  let shuttingDown = false;
  const shutdownOnce = (reason, err) => {
    if (shuttingDown) return;
    shuttingDown = true;

    if (err) {
      logger.error(`💥 ${reason}`, {
        message: err?.message || String(err),
        stack: err?.stack,
      });
    } else {
      logger.warn(`🛑 Shutdown requested: ${reason}`);
    }

    // Delegate to your existing shutdown module
    gracefulShutdown(reason, server, wss);
  };

  // 4) Process-level handlers
  ["SIGTERM", "SIGINT", "SIGUSR2"].forEach((sig) => {
    process.once(sig, () => shutdownOnce(sig));
  });

  process.once("uncaughtException", (err) =>
    shutdownOnce("uncaughtException", err)
  );
  process.once("unhandledRejection", (reason) =>
    shutdownOnce("unhandledRejection", reason)
  );

  try {
    // 5) Connect DB first
    await connectDB();

    // 6) Start listening
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(CONFIG.PORT, resolve);
    });

    const { apiUrl, wsUrl } = buildPublicUrls();

    logger.info(`🚀 Server started`, {
      port: CONFIG.PORT,
      env: CONFIG.NODE_ENV,
      api: apiUrl,
      websocket: wsUrl,
    });

    return { app, server, wss, broadcastComplaint };
  } catch (err) {
    shutdownOnce("startup_failed", err);
    // If gracefulShutdown doesn’t exit, ensure the process ends with a failure code.
    process.exitCode = 1;
    throw err;
  }
}

module.exports = startServer;
