const { URL } = require("node:url");

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

const SIGNALS = ["SIGTERM", "SIGINT", "SIGUSR2"];

const clean = (v) =>
  String(v ?? "")
    .trim()
    .replace(/\/+$/, "");

function toError(value) {
  if (value instanceof Error) return value;
  return new Error(typeof value === "string" ? value : JSON.stringify(value));
}

function parseHttpOrigin(origin) {
  const value = clean(origin);
  if (!value) return null;

  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      "PUBLIC_ORIGIN/BASE_URL must start with http:// or https://"
    );
  }

  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

function buildPublicUrls() {
  const originUrl =
    parseHttpOrigin(CONFIG.PUBLIC_ORIGIN) ||
    parseHttpOrigin(process.env.PUBLIC_ORIGIN) ||
    parseHttpOrigin(CONFIG.BASE_URL) ||
    parseHttpOrigin(process.env.BASE_URL);

  if (!originUrl && CONFIG.NODE_ENV === "production") {
    throw new Error("Missing PUBLIC_ORIGIN (or BASE_URL) in production");
  }

  const origin = originUrl ? clean(originUrl.toString()) : null;

  const apiUrl = originUrl
    ? clean(new URL("/api", originUrl).toString())
    : "/api";

  const wsExplicit = clean(process.env.WS_PUBLIC_URL);
  const wsUrl = wsExplicit
    ? wsExplicit
    : originUrl
    ? (() => {
        const ws = new URL(originUrl.toString());
        ws.protocol = ws.protocol === "https:" ? "wss:" : "ws:";
        ws.pathname = "/ws/complaints";
        ws.search = "";
        ws.hash = "";
        return clean(ws.toString());
      })()
    : "/ws/complaints";

  return { origin, apiUrl, wsUrl };
}

function createShutdownOnce(server, wss) {
  let shuttingDown = false;

  return (reason, err) => {
    if (shuttingDown) return;
    shuttingDown = true;

    if (err) {
      logger.error(`Shutdown: ${reason}`, {
        message: err?.message || String(err),
        stack: err?.stack,
      });
    } else {
      logger.warn(`Shutdown requested: ${reason}`);
    }

    gracefulShutdown(reason, server, wss);
  };
}

function registerProcessHandlers(shutdownOnce) {
  SIGNALS.forEach((sig) => process.once(sig, () => shutdownOnce(sig)));
  process.once("uncaughtException", (err) =>
    shutdownOnce("uncaughtException", err)
  );
  process.once("unhandledRejection", (reason) =>
    shutdownOnce("unhandledRejection", toError(reason))
  );
}

function listenAsync(server, port, host) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
}

async function startServer() {
  validateEnvironment();
  createUploadDirectories();

  const app = buildExpressApp();
  const { server, wss, broadcastComplaint } = createServerWithWebSocket(app);

  const shutdownOnce = createShutdownOnce(server, wss);
  registerProcessHandlers(shutdownOnce);

  try {
    await connectDB();
    await listenAsync(server, CONFIG.PORT, CONFIG.HOST);

    const { origin, apiUrl, wsUrl } = buildPublicUrls();

    logger.info("Server started", {
      port: CONFIG.PORT,
      host: CONFIG.HOST,
      env: CONFIG.NODE_ENV,
      publicOrigin: origin,
      api: apiUrl,
      websocket: wsUrl,
    });

    return { app, server, wss, broadcastComplaint };
  } catch (err) {
    shutdownOnce("startup_failed", err);
    process.exitCode = 1;
    throw err;
  }
}

module.exports = startServer;
