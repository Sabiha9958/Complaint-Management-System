// src/controllers/complaintController.js

/**
 * Complaint Controller
 * Handles complaint creation, updates, file attachments, stats, comments.
 */

const fs = require("fs");
const path = require("path");
const { StatusCodes } = require("http-status-codes");
const Complaint = require("../models/Complaint");
const logger = require("../utils/logger");

// WebSocket broadcast helper (make sure the file is named websocket/index.js)
const { broadcast } = require("../websoket");

/* ========================================================================
 * 🔧 Helper utilities
 * ===================================================================== */

// Generic error sender
const sendErrorResponse = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

// Cleanup uploaded files from disk
const cleanupFiles = (files) => {
  if (!Array.isArray(files)) return;
  files.forEach((file) => {
    try {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      logger.warn(`Failed to cleanup file: ${file?.path}`, err);
    }
  });
};

// Safe WebSocket broadcast wrapper
const broadcastComplaintEvent = (type, complaint, extra = {}) => {
  try {
    const payload =
      complaint && typeof complaint.toObject === "function"
        ? complaint.toObject()
        : complaint;

    broadcast({
      type,
      data: {
        ...payload,
        ...extra,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn(
      `Failed to broadcast complaint event "${type}" for ${complaint?._id}:`,
      err.message
    );
  }
};

/* ========================================================================
 * 📝 Create complaint  | POST /api/complaints
 * ===================================================================== */

const createComplaint = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      cleanupFiles(req.files);
      return sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        "User not authenticated."
      );
    }

    let { title, description, category, priority, contactInfo } = req.body;

    if (!title?.trim() || !description?.trim()) {
      cleanupFiles(req.files);
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Title and description are required."
      );
    }

    // Parse contactInfo if sent as JSON (FormData)
    if (typeof contactInfo === "string") {
      try {
        contactInfo = JSON.parse(contactInfo);
      } catch {
        cleanupFiles(req.files);
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Invalid contact info format."
        );
      }
    }

    // Fallback contact info from user
    if (!contactInfo) {
      contactInfo = {
        name: req.user.name || "",
        email: req.user.email || "",
        phone: req.user.phone || "",
      };
    }

    if (!contactInfo.name?.trim() || !contactInfo.email?.trim()) {
      cleanupFiles(req.files);
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Contact name and email are required."
      );
    }

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const complaintData = {
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || "other",
      priority: priority?.trim() || "medium",
      user: req.user._id,
      contactInfo: {
        name: contactInfo.name.trim(),
        email: contactInfo.email.trim().toLowerCase(),
        phone: contactInfo.phone?.trim() || "",
      },
      status: "pending",
      attachments: [],
    };

    // Attachments from Multer
    if (Array.isArray(req.files) && req.files.length > 0) {
      complaintData.attachments = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `${baseUrl}/uploads/complaints/${file.filename}`,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      }));
    }

    const complaint = await Complaint.create(complaintData);
    await complaint.populate("user", "name email role avatar");

    logger.info(
      `Complaint created by ${req.user.email} (ID: ${complaint._id}) with ${complaintData.attachments.length} attachment(s)`
    );

    // WebSocket: notify dashboards
    broadcastComplaintEvent("NEW_COMPLAINT", complaint);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Complaint submitted successfully.",
      data: complaint,
      complaintId: complaint._id,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      cleanupFiles(req.files);
      logger.error("Create complaint validation error:", error);
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message || "Invalid complaint data."
      );
    }

    cleanupFiles(req.files);
    logger.error("Create complaint error:", error);
    return sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to create complaint."
    );
  }
};

/* ========================================================================
 * 📋 Get complaints (all) | GET /api/complaints
 * ===================================================================== */

const getComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      department,
      search,
      sortBy = "-createdAt",
    } = req.query;

    const query = {};

    // IMPORTANT: allow all authenticated users to see all complaints
    // (My complaints page still uses /api/complaints/my)
    // If you ever want "only mine" from this route, add scope=mine handling.

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (department) query.department = department;

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { "contactInfo.name": regex },
        { "contactInfo.email": regex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate("user", "name email role avatar")
        .populate("assignedTo", "name email role")
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(query),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      count: complaints.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: complaints,
    });
  } catch (error) {
    logger.error("Get complaints error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch complaints."
    );
  }
};

/* ========================================================================
 * 👤 Get my complaints | GET /api/complaints/my
 * ===================================================================== */

const getMyComplaints = async (req, res) => {
  try {
    const { status, sortBy = "-createdAt" } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const complaints = await Complaint.find(query)
      .populate("assignedTo", "name email role")
      .sort(sortBy)
      .lean();

    const stats = {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "pending").length,
      in_progress: complaints.filter((c) => c.status === "in_progress").length,
      resolved: complaints.filter((c) => c.status === "resolved").length,
      rejected: complaints.filter((c) => c.status === "rejected").length,
      closed: complaints.filter((c) => c.status === "closed").length,
    };

    res.status(StatusCodes.OK).json({
      success: true,
      count: complaints.length,
      data: complaints,
      stats,
    });
  } catch (error) {
    logger.error("Get my complaints error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch your complaints."
    );
  }
};

/* ========================================================================
 * 🔍 Get single complaint | GET /api/complaints/:id
 * ===================================================================== */

const getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "name email role avatar phone")
      .populate("assignedTo", "name email role avatar")
      .populate("comments.user", "name email role avatar")
      .populate("statusHistory.changedBy", "name email role")
      .populate("resolvedBy", "name email role");

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const isOwner = complaint.user._id.toString() === req.user._id.toString();
    const isStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Not authorized to view this complaint."
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    logger.error("Get complaint error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch complaint."
    );
  }
};

/* ========================================================================
 * ✏️ Update complaint | PUT /api/complaints/:id
 * ===================================================================== */

const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const isOwner = complaint.user.toString() === req.user._id.toString();
    const isStaff = ["admin", "staff"].includes(req.user.role);

    if (isOwner && complaint.status === "pending") {
      const allowedUpdates = ["title", "description", "category", "priority"];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          complaint[field] = req.body[field];
        }
      });
    } else if (isStaff) {
      if (req.body.status) {
        await complaint.updateStatus(
          req.body.status,
          req.user._id,
          req.body.statusNote
        );
      }
      if (req.body.notes !== undefined) {
        complaint.notes = req.body.notes.trim();
      }
      if (req.body.assignedTo) {
        complaint.assignedTo = req.body.assignedTo;
      }
    } else {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Not authorized to update this complaint."
      );
    }

    await complaint.save();

    logger.info(`Complaint ${complaint._id} updated by ${req.user.email}`);

    // Broadcast updated complaint for dashboards
    broadcastComplaintEvent("UPDATED_COMPLAINT", complaint);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Complaint updated successfully.",
      data: complaint,
    });
  } catch (error) {
    logger.error("Update complaint error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update complaint."
    );
  }
};

/* ========================================================================
 * ✅ Update status | PATCH /api/complaints/:id/status
 * ===================================================================== */

const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Status is required."
      );
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    await complaint.updateStatus(status, req.user._id, note);

    logger.info(
      `Complaint ${complaint._id} status updated to ${status} by ${req.user.email}`
    );

    // Broadcast status change
    broadcastComplaintEvent("UPDATED_COMPLAINT", complaint, {
      statusChanged: true,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Complaint status updated successfully.",
      data: complaint,
    });
  } catch (error) {
    logger.error("Update complaint status error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update complaint status."
    );
  }
};

/* ========================================================================
 * 🗑️ Delete complaint | DELETE /api/complaints/:id
 * ===================================================================== */

const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const isOwner = complaint.user.toString() === req.user._id.toString();
    const isStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Not authorized to delete this complaint."
      );
    }

    if (isOwner && complaint.status !== "pending") {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Can only delete pending complaints."
      );
    }

    const deletedId = complaint._id;
    await complaint.deleteOne();

    logger.info(`Complaint ${deletedId} deleted by ${req.user.email}`);

    // Broadcast deletion
    broadcastComplaintEvent("DELETED_COMPLAINT", { _id: deletedId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Complaint deleted successfully.",
    });
  } catch (error) {
    logger.error("Delete complaint error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to delete complaint."
    );
  }
};

/* ========================================================================
 * 📊 Global stats | GET /api/complaints/stats
 * ===================================================================== */

const getComplaintStats = async (req, res) => {
  try {
    const [statusStats, categoryStats, priorityStats, recentComplaints] =
      await Promise.all([
        Complaint.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        Complaint.countDocuments({
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

    const total = await Complaint.countDocuments();

    const result = {
      total,
      recent: recentComplaints,
      byStatus: {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
        closed: 0,
      },
      byCategory: {},
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
    };

    statusStats.forEach(({ _id, count }) => {
      result.byStatus[_id] = count;
    });

    categoryStats.forEach(({ _id, count }) => {
      result.byCategory[_id] = count;
    });

    priorityStats.forEach(({ _id, count }) => {
      result.byPriority[_id] = count;
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Get complaint stats error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch complaint statistics."
    );
  }
};

/* ========================================================================
 * 💬 Comments
 * ===================================================================== */

const addComplaintComment = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Comment text is required."
      );
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const isOwner = complaint.user.toString() === req.user._id.toString();
    const isStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "Not authorized to comment on this complaint."
      );
    }

    const newComment = await complaint.addComment(
      req.user._id,
      comment,
      isStaff
    );

    await complaint.populate("comments.user", "name email role avatar");

    logger.info(
      `Comment added to complaint ${complaint._id} by ${req.user.email}`
    );

    // Broadcast comment added event
    broadcastComplaintEvent("NEW_COMMENT", {
      complaintId: complaint._id,
      comment: newComment,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Comment added successfully.",
      data: newComment,
    });
  } catch (error) {
    logger.error("Add comment error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to add comment."
    );
  }
};

const getComplaintComments = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .select("comments")
      .populate("comments.user", "name email role avatar");

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      count: complaint.comments.length,
      data: complaint.comments,
    });
  } catch (error) {
    logger.error("Get comments error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch comments."
    );
  }
};

/* ========================================================================
 * 📎 Attachments
 * ===================================================================== */

const downloadComplaintAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Complaint not found."
      );
    }

    const attachment = complaint.attachments.id(attachmentId);

    if (!attachment) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Attachment not found."
      );
    }

    const filePath = attachment.path
      ? attachment.path
      : path.join(process.cwd(), "uploads", "complaints", attachment.filename);

    if (!fs.existsSync(filePath)) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "File not found on server."
      );
    }

    res.download(filePath, attachment.originalName);
  } catch (error) {
    logger.error("Download attachment error:", error);
    sendErrorResponse(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to download attachment."
    );
  }
};

module.exports = {
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
};
