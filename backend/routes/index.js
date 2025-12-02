const express = require("express");
const router = express.Router();

// Import modular route handlers (each must export an Express router)
const authRoutes = require("./authRoutes");
const userRoutes = require("./usersRoutes");
const complaintRoutes = require("./complaintsRoutes");
const reportRoutes = require("./reports");

/**
 * Health Check Endpoint
 * Useful for uptime monitoring and basic API health status.
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy 🚀",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Overview
 * Provides metadata about available API endpoints and versions.
 */
router.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Complaint Management System API v1.0.0",
    status: "operational",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        base: "/api/v1/auth",
        routes: {
          login: "POST /api/v1/auth/login",
          register: "POST /api/v1/auth/register",
          me: "GET /api/v1/auth/me",
          logout: "POST /api/v1/auth/logout",
          changePassword: "PUT /api/v1/auth/change-password",
          forgotPassword: "POST /api/v1/auth/forgot-password",
          resetPassword: "PUT /api/v1/auth/reset-password/:token",
        },
      },
      users: {
        base: "/api/v1/users",
        routes: {
          list: "GET /api/v1/users",
          get: "GET /api/v1/users/:id",
          update: "PUT /api/v1/users/:id",
          delete: "DELETE /api/v1/users/:id",
        },
      },
      complaints: {
        base: "/api/v1/complaints",
        routes: {
          my: "GET /api/v1/complaints/my", // <-- Add this route explicitly if implemented
          list: "GET /api/v1/complaints",
          create: "POST /api/v1/complaints",
          get: "GET /api/v1/complaints/:id",
          update: "PUT /api/v1/complaints/:id",
          delete: "DELETE /api/v1/complaints/:id",
          assign: "PUT /api/v1/complaints/:id/assign",
          status: "PUT /api/v1/complaints/:id/status",
          comment: "POST /api/v1/complaints/:id/comments",
          upvote: "POST /api/v1/complaints/:id/upvote",
          attachments: {
            add: "POST /api/v1/complaints/:id/attachments",
            delete: "DELETE /api/v1/complaints/:id/attachments/:attachmentId",
          },
        },
      },
      reports: {
        base: "/api/v1/reports",
        routes: {
          overview: "GET /api/v1/reports/overview",
          byCategory: "GET /api/v1/reports/by-category",
          byStatus: "GET /api/v1/reports/by-status",
          trends: "GET /api/v1/reports/trends",
          exportComplaints: "GET /api/v1/reports/complaints/export",
          exportUsers: "GET /api/v1/reports/users/export",
        },
      },
    },
  });
});

/**
 * Mount versioned API routers
 * Order matters: define specific routes before parameterized routes in each router.
 */
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/users", userRoutes);
router.use("/api/v1/complaints", complaintRoutes);
router.use("/api/v1/reports", reportRoutes);

/**
 * Catch-all 404 Not Found handler for unmatched routes
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

module.exports = router;
