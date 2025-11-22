/**
 * Complaint Management System - Server Entry Point
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

/**
 * ============================================
 * SECURITY & GENERAL MIDDLEWARE
 * ============================================
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiLimiter);

/**
 * ============================================
 * ROUTES
 * ============================================
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Complaint Management System API",
    version: "1.0.0",
    documentation: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

const routes = require("./routes");
app.use("/api", routes);

/**
 * ============================================
 * ERROR HANDLING
 * ============================================
 */
app.use(notFound);
app.use(errorHandler);

/**
 * ============================================
 * SERVER INITIALIZATION
 * ============================================
 */
const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log("\n" + "=".repeat(70));
      console.log("🚀 Complaint Management System - Server Started");
      console.log("=".repeat(70));
      console.log(`📍 Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log("=".repeat(70) + "\n");
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
};

startServer();

/**
 * ============================================
 * GRACEFUL SHUTDOWN
 * ============================================
 */
const shutdown = () => {
  console.log("👋 Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  }
};

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  shutdown();
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = app;
