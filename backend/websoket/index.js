/**
 * ================================================================
 * 🔌 WEBSOCKET SERVER - Real-time Updates
 * ================================================================
 */

const WebSocket = require("ws");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 * @returns {WebSocket.Server} WebSocket server instance
 */
const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({
    noServer: true,
    path: "/ws/complaints",
  });

  // Handle WebSocket upgrade
  server.on("upgrade", (request, socket, head) => {
    // Parse URL for path matching
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (pathname === "/ws/complaints") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle new connections
  wss.on("connection", async (ws, request) => {
    logger.info("✅ New WebSocket connection established");

    // Optional: Authenticate WebSocket connection
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get("token");

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ws.userId = decoded.id;
        ws.userRole = decoded.role;
        logger.info(`🔐 WebSocket authenticated for user: ${ws.userId}`);
      } else {
        logger.info("🔓 WebSocket connection without authentication");
      }
    } catch (error) {
      logger.warn("⚠️ WebSocket authentication failed:", error.message);
    }

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to real-time updates",
        timestamp: new Date().toISOString(),
      })
    );

    // Handle incoming messages
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        logger.info("📨 WebSocket message received:", data);

        // Handle different message types
        switch (data.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;

          case "subscribe":
            ws.subscribe = data.channel || "complaints";
            logger.info(`📡 Client subscribed to: ${ws.subscribe}`);
            ws.send(
              JSON.stringify({
                type: "subscribed",
                channel: ws.subscribe,
                message: `Subscribed to ${ws.subscribe} updates`,
              })
            );
            break;

          case "unsubscribe":
            logger.info(`🔕 Client unsubscribed from: ${ws.subscribe}`);
            ws.subscribe = null;
            break;

          default:
            logger.warn("⚠️ Unknown message type:", data.type);
        }
      } catch (error) {
        logger.error("❌ Error parsing WebSocket message:", error);
      }
    });

    // Handle connection errors
    ws.on("error", (error) => {
      logger.error("❌ WebSocket error:", error);
    });

    // Handle disconnection
    ws.on("close", () => {
      logger.info("🔌 WebSocket connection closed");
    });

    // Keep connection alive with ping/pong
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  // Heartbeat to detect broken connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.warn("💀 Terminating inactive WebSocket connection");
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  // Cleanup on server shutdown
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
    logger.info("🔌 WebSocket server closed");
  });

  logger.info("🚀 WebSocket server initialized");

  return wss;
};

/**
 * Broadcast message to all connected clients
 * @param {WebSocket.Server} wss - WebSocket server instance
 * @param {Object} data - Data to broadcast
 * @param {String} channel - Optional channel filter
 */
const broadcast = (wss, data, channel = null) => {
  if (!wss || !wss.clients) {
    logger.warn("⚠️ WebSocket server not available for broadcast");
    return;
  }

  const message = JSON.stringify({
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  });

  let sentCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // Filter by channel if specified
      if (!channel || client.subscribe === channel) {
        client.send(message);
        sentCount++;
      }
    }
  });

  logger.info(`📢 Broadcast to ${sentCount} client(s) - Type: ${data.type}`);
};

/**
 * Send message to specific user
 * @param {WebSocket.Server} wss - WebSocket server instance
 * @param {String} userId - Target user ID
 * @param {Object} data - Data to send
 */
const sendToUser = (wss, userId, data) => {
  if (!wss || !wss.clients) {
    logger.warn("⚠️ WebSocket server not available for user message");
    return;
  }

  const message = JSON.stringify({
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  });

  let sent = false;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(message);
      sent = true;
    }
  });

  if (sent) {
    logger.info(`📨 Message sent to user ${userId} - Type: ${data.type}`);
  } else {
    logger.warn(`⚠️ User ${userId} not connected or not found`);
  }
};

/**
 * Get connected clients count
 * @param {WebSocket.Server} wss - WebSocket server instance
 * @returns {Number} Number of connected clients
 */
const getConnectedCount = (wss) => {
  if (!wss || !wss.clients) return 0;
  return Array.from(wss.clients).filter(
    (client) => client.readyState === WebSocket.OPEN
  ).length;
};

module.exports = {
  initializeWebSocket,
  broadcast,
  sendToUser,
  getConnectedCount,
};
