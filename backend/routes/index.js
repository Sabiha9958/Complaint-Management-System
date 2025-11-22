/**
 * Routes Index
 * Central location for all route imports
 */

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth");
const complaintRoutes = require("./complaints");
const userRoutes = require("./users");
const reportsRoutes = require("./reports");

// API health check
router.get("/health", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

// Mount routes
router.use("/auth", authRoutes); // Authentication routes
router.use("/complaints", complaintRoutes); // Complaint management routes
router.use("/users", userRoutes); // User management routes
router.use("/reports", reportsRoutes); // Reports & analytics routes

module.exports = router;
