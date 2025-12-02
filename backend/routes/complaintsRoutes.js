// routes/complaintRoutes.js
/**
 * ================================================================
 * 🧾 Complaint Routes
 * Handles complaint submission, management, attachments, and stats.
 * Base path: /api/complaints
 * ================================================================
 */

const express = require("express");
const router = express.Router();

// Models
const Complaint = require("../models/Complaint");

// Controllers
const {
  createComplaint,
  getComplaints,
  getMyComplaints,
  getComplaint,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStats,
  addComplaintComment,
  getComplaintComments,
  downloadComplaintAttachment,
} = require("../controllers/complaintController");

// Middleware
const { protect, authorize } = require("../middleware/auth");
const {
  complaintCreateValidator,
  complaintUpdateValidator,
  paginationValidator,
  complaintStatusValidator,
  commentValidator,
} = require("../middleware/validator");
const {
  apiLimiter,
  sensitiveLimiter,
  uploadLimiter,
} = require("../middleware/rateLimiter");
const {
  uploadComplaintAttachments,
  handleMulterError,
  cleanupUploadedFiles,
} = require("../middleware/uploadMiddleware");

// =================================================================
// 🛡️ OWNERSHIP CHECK MIDDLEWARE
// =================================================================

/**
 * Ensures the current user is allowed to access the complaint:
 * - Admin/staff: any complaint
 * - User: only own complaints
 * Attaches the complaint document to req.complaint.
 */
const checkComplaintOwnership = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Admin and staff can access all complaints
    if (["admin", "staff"].includes(req.user.role)) {
      req.complaint = complaint;
      return next();
    }

    // Users can only access their own complaints
    if (complaint.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this complaint",
      });
    }

    req.complaint = complaint;
    next();
  } catch (error) {
    console.error("Error in checkComplaintOwnership:", error);
    res.status(500).json({
      success: false,
      message: "Error checking complaint ownership",
    });
  }
};

// =================================================================
// 📊 STATISTICS ROUTES
// =================================================================

/**
 * @route   GET /api/complaints/stats
 * @desc    Get global complaint statistics (admin/staff only)
 * @access  Private (Admin, Staff)
 */
router.get("/stats", protect, authorize("admin", "staff"), getComplaintStats);

/**
 * @route   GET /api/complaints/stats/user
 * @desc    Get logged-in user's personal complaint statistics
 * @access  Private
 */
router.get("/stats/user", protect, async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);

    const result = {
      total,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      closed: 0,
    };

    stats.forEach((stat) => {
      result[stat._id] = stat.count;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching user complaint stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
    });
  }
});

// =================================================================
// 📝 USER COMPLAINTS ROUTES
// =================================================================

/**
 * @route   GET /api/complaints/my
 * @desc    Get logged-in user's complaints
 * @access  Private
 */
router.get("/my", protect, paginationValidator, getMyComplaints);

// =================================================================
// 🆕 CREATE COMPLAINT WITH ATTACHMENTS
// =================================================================

/**
 * @route   POST /api/complaints
 * @desc    Create new complaint with optional file attachments
 * @access  Private
 */
router.post(
  "/",
  protect,
  uploadLimiter,
  cleanupUploadedFiles,
  uploadComplaintAttachments,
  handleMulterError,
  complaintCreateValidator,
  createComplaint
);

// =================================================================
// 📋 LIST & FILTER ROUTES
// =================================================================

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints with filters and pagination
 * @access  Private (Admin/Staff recommended)
 * @query   ?page=1&limit=20&status=pending&category=IT&priority=high&search=keyword
 *
 * NOTE: paginationValidator should enforce sane defaults and a max limit
 * (e.g. limit <= 100) and return 400 for invalid values.
 */
router.get("/", protect, paginationValidator, getComplaints);

/**
 * @route   GET /api/complaints/search
 * @desc    Advanced search complaints
 * @access  Private (Admin, Staff)
 */
router.get(
  "/search",
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const { keyword, startDate, endDate, userId, category, status } =
        req.query;

      const query = {};

      if (keyword) {
        query.$or = [
          { title: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
          { "contactInfo.name": { $regex: keyword, $options: "i" } },
          { "contactInfo.email": { $regex: keyword, $options: "i" } },
        ];
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      if (userId) query.user = userId;
      if (category) query.category = category;
      if (status) query.status = status;

      const complaints = await Complaint.find(query)
        .populate("user", "name email avatar")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        count: complaints.length,
        data: complaints,
      });
    } catch (error) {
      console.error("Complaint search error:", error);
      res.status(500).json({
        success: false,
        message: "Search failed",
      });
    }
  }
);

// =================================================================
// 🔍 SINGLE COMPLAINT ROUTES
// =================================================================

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID
 * @access  Private (Owner, Admin, Staff)
 */
router.get("/:id", protect, checkComplaintOwnership, getComplaint);

/**
 * @route   PUT /api/complaints/:id
 * @desc    Update complaint details
 * @access  Private (Owner for details, Admin/Staff for status)
 */
router.put(
  "/:id",
  protect,
  sensitiveLimiter,
  checkComplaintOwnership,
  complaintUpdateValidator,
  updateComplaint
);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status (Admin/Staff only)
 * @access  Private (Admin, Staff)
 */
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  complaintStatusValidator,
  updateComplaintStatus
);

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete complaint
 * @access  Private (Owner if pending, Admin anytime)
 */
router.delete(
  "/:id",
  protect,
  sensitiveLimiter,
  checkComplaintOwnership,
  deleteComplaint
);

// =================================================================
// 💬 COMMENTS ROUTES
// =================================================================

/**
 * @route   GET /api/complaints/:id/comments
 * @desc    Get all comments for a complaint
 * @access  Private (Owner, Admin, Staff)
 */
router.get(
  "/:id/comments",
  protect,
  checkComplaintOwnership,
  getComplaintComments
);

/**
 * @route   POST /api/complaints/:id/comments
 * @desc    Add comment to complaint
 * @access  Private (Owner, Admin, Staff)
 */
router.post(
  "/:id/comments",
  protect,
  apiLimiter,
  checkComplaintOwnership,
  commentValidator,
  addComplaintComment
);

// =================================================================
// 📎 ATTACHMENT ROUTES
// =================================================================

/**
 * @route   GET /api/complaints/:id/attachments/:attachmentId
 * @desc    Download complaint attachment
 * @access  Private (Owner, Admin, Staff)
 */
router.get(
  "/:id/attachments/:attachmentId",
  protect,
  checkComplaintOwnership,
  downloadComplaintAttachment
);

/**
 * @route   POST /api/complaints/:id/attachments
 * @desc    Add additional attachments to existing complaint
 * @access  Private (Owner, Admin, Staff)
 */
router.post(
  "/:id/attachments",
  protect,
  uploadLimiter,
  checkComplaintOwnership,
  cleanupUploadedFiles,
  uploadComplaintAttachments,
  handleMulterError,
  async (req, res) => {
    try {
      const complaint = req.complaint;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      // Check total attachment limit
      const currentCount = complaint.attachments?.length || 0;
      if (currentCount + req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: "Maximum 5 attachments allowed per complaint",
        });
      }

      // Add attachments
      for (const file of req.files) {
        await complaint.addAttachment(file, req);
      }

      res.status(201).json({
        success: true,
        message: "Attachments added successfully",
        data: complaint,
      });
    } catch (error) {
      console.error("Add attachment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add attachments",
      });
    }
  }
);

/**
 * @route   DELETE /api/complaints/:id/attachments/:attachmentId
 * @desc    Delete attachment from complaint
 * @access  Private (Owner, Admin, Staff)
 */
router.delete(
  "/:id/attachments/:attachmentId",
  protect,
  sensitiveLimiter,
  checkComplaintOwnership,
  async (req, res) => {
    try {
      const complaint = req.complaint;
      const { attachmentId } = req.params;

      await complaint.deleteAttachment(attachmentId);

      res.json({
        success: true,
        message: "Attachment deleted successfully",
      });
    } catch (error) {
      console.error("Delete attachment error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete attachment",
      });
    }
  }
);

// =================================================================
// 📤 EXPORT ROUTES
// =================================================================

/**
 * @route   GET /api/complaints/export/csv
 * @desc    Export complaints as CSV
 * @access  Private (Admin, Staff)
 */
router.get(
  "/export/csv",
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const { Parser } = require("json2csv");

      const complaints = await Complaint.find({})
        .populate("user", "name email")
        .lean();

      const fields = [
        { label: "ID", value: "_id" },
        { label: "Title", value: "title" },
        { label: "Description", value: "description" },
        { label: "Status", value: "status" },
        { label: "Priority", value: "priority" },
        { label: "Category", value: "category" },
        { label: "Created At", value: "createdAt" },
        { label: "User Name", value: "user.name" },
        { label: "User Email", value: "user.email" },
        { label: "Contact Name", value: "contactInfo.name" },
        { label: "Contact Email", value: "contactInfo.email" },
        { label: "Contact Phone", value: "contactInfo.phone" },
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(complaints);

      res.header("Content-Type", "text/csv");
      res.attachment(`complaints-export-${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({
        success: false,
        message: "Export failed",
      });
    }
  }
);

module.exports = router;
