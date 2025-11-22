/**
 * Complaint Routes
 * Handles all complaint-related operations
 */

const express = require("express");
const router = express.Router();
const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  getComplaintsByUser,
  updateStatus,
  assignComplaint,
  resolveComplaint,
  uploadAttachments,
  deleteComplaint,
  getComplaintStats,
  updateComplaint,
} = require("../controllers/complaintController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  validateComplaint,
  validateObjectId,
} = require("../middleware/validator");
const { complaintLimiter } = require("../middleware/rateLimiter");

// Import file upload from utils folder
const upload = require("../utils/fileUpload");
const handleUploadError = require("../middleware/uploadErrorHandler");

/**
 * ============================================
 * PUBLIC/OPTIONAL AUTH ROUTES
 * ============================================
 */

// Create complaint (public or authenticated)
router.post(
  "/",
  complaintLimiter,
  optionalAuth,
  validateComplaint,
  createComplaint
);

/**
 * ============================================
 * PROTECTED ROUTES - ALL AUTHENTICATED USERS
 * ============================================
 */

// Get statistics - MUST come before /:id route
router.get(
  "/stats/dashboard",
  protect,
  authorize("staff", "admin"),
  getComplaintStats
);

// Get all complaints with filters
router.get("/", protect, getAllComplaints);

// Get complaints by user
router.get("/user/:userId", protect, getComplaintsByUser);

// Get single complaint by ID
router.get("/:id", protect, validateObjectId, getComplaintById);

// Update complaint
router.put("/:id", protect, validateObjectId, updateComplaint);

/**
 * ============================================
 * PROTECTED ROUTES - STAFF AND ADMIN ONLY
 * ============================================
 */

// Update complaint status
router.put(
  "/:id/status",
  protect,
  authorize("staff", "admin"),
  validateObjectId,
  updateStatus
);

// Resolve complaint
router.put(
  "/:id/resolve",
  protect,
  authorize("staff", "admin"),
  validateObjectId,
  resolveComplaint
);

/**
 * ============================================
 * PROTECTED ROUTES - ADMIN ONLY
 * ============================================
 */

// Assign complaint to staff
router.put(
  "/:id/assign",
  protect,
  authorize("admin"),
  validateObjectId,
  assignComplaint
);

// Delete complaint
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateObjectId,
  deleteComplaint
);

/**
 * ============================================
 * FILE UPLOAD ROUTES
 * ============================================
 */

// Upload attachments to complaint
router.post(
  "/:id/attachments",
  protect,
  validateObjectId,
  upload.uploadMultiple,
  handleUploadError,
  uploadAttachments
);

module.exports = router;
