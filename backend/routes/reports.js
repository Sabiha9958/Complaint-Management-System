/**
 * Report Routes
 * Handles complaint and user reporting/statistics for dashboards and exports.
 */

const express = require("express");
const router = express.Router();

const {
  getComplaintStats,
  getUserStats,
  exportComplaintStatsCSV,
  exportComplaintStatsExcel,
  exportUserStatsCSV,
  exportUserStatsExcel,
} = require("../controllers/reportController");

const { protect, authorize } = require("../middleware/auth");
const { paginationValidator } = require("../middleware/validator");
const { sensitiveLimiter } = require("../middleware/rateLimiter");

// =======================
// Admin/Staff Routes
// =======================

// Complaint statistics (admin/staff only)
router.get(
  "/complaints",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  getComplaintStats
);

// Export complaint statistics (CSV)
router.get(
  "/complaints/export/csv",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  exportComplaintStatsCSV
);

// Export complaint statistics (Excel)
router.get(
  "/complaints/export/excel",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  exportComplaintStatsExcel
);

// User statistics (admin only)
router.get(
  "/users",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  paginationValidator,
  getUserStats
);

// Export user statistics (CSV)
router.get(
  "/users/export/csv",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  exportUserStatsCSV
);

// Export user statistics (Excel)
router.get(
  "/users/export/excel",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  exportUserStatsExcel
);

module.exports = router;
