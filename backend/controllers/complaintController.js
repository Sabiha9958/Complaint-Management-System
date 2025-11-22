/**
 * Complaint Controller
 * Handles all complaint-related operations with comprehensive error handling
 */

const Complaint = require("../models/Complaint");
const StatusHistory = require("../models/StatusHistory");
const { deleteFile, deleteMultipleFiles } = require("../utils/fileUpload");
const fs = require("fs").promises;
const path = require("path");

/**
 * @desc    Create new complaint
 * @route   POST /api/complaints
 * @access  Public/Private (depending on configuration)
 */
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, contactInfo } = req.body;

    // Validate contact information
    if (!contactInfo || !contactInfo.name || !contactInfo.email) {
      return res.status(400).json({
        success: false,
        message: "Contact information (name and email) is required",
      });
    }

    // Create complaint with auto-generated ID
    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || "Medium",
      contactInfo,
      createdBy: req.user?._id || null, // Optional user ID if authenticated
    });

    // Create initial status history entry
    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: "None",
      newStatus: "Pending",
      changedBy: req.user?._id || complaint._id,
      notes: "Complaint created and submitted",
    });

    // Populate created complaint data
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email department");

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: populatedComplaint,
    });
  } catch (error) {
    console.error("Create Complaint Error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating complaint",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all complaints with advanced filtering, search, and pagination
 * @route   GET /api/complaints
 * @access  Private (Staff/Admin)
 */
exports.getAllComplaints = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      assignedTo,
      dateFrom,
      dateTo,
    } = req.query;

    // Build query object
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by assigned staff
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    // Text search across multiple fields
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { complaintId: { $regex: search, $options: "i" } },
        { "contactInfo.name": { $regex: search, $options: "i" } },
        { "contactInfo.email": { $regex: search, $options: "i" } },
      ];
    }

    // Role-based filtering: Users can only see their own complaints
    if (req.user && req.user.role === "user") {
      query.createdBy = req.user._id;
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with population
    const complaints = await Complaint.find(query)
      .populate("assignedTo", "name email department role")
      .populate("createdBy", "name email")
      .sort(sort)
      .limit(limitNum)
      .skip(skip)
      .lean(); // Use lean for better performance

    // Get total count for pagination
    const total = await Complaint.countDocuments(query);

    // Calculate statistics
    const stats = {
      total,
      pending: await Complaint.countDocuments({ ...query, status: "Pending" }),
      inProgress: await Complaint.countDocuments({
        ...query,
        status: "In Progress",
      }),
      resolved: await Complaint.countDocuments({
        ...query,
        status: "Resolved",
      }),
    };

    res.status(200).json({
      success: true,
      count: complaints.length,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
      stats,
      data: complaints,
    });
  } catch (error) {
    console.error("Get All Complaints Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complaints",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get single complaint by ID with status history
 * @route   GET /api/complaints/:id
 * @access  Private
 */
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID format",
      });
    }

    // Find complaint with populated fields
    const complaint = await Complaint.findById(id)
      .populate("assignedTo", "name email department role phone")
      .populate("createdBy", "name email phone");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Authorization: Users can only view their own complaints
    if (
      req.user.role === "user" &&
      complaint.createdBy?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this complaint",
      });
    }

    // Get status history
    const history = await StatusHistory.getComplaintHistory(complaint._id);

    res.status(200).json({
      success: true,
      data: {
        complaint,
        history,
      },
    });
  } catch (error) {
    console.error("Get Complaint By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complaint details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get complaints by user
 * @route   GET /api/complaints/user/:userId
 * @access  Private
 */
exports.getComplaintsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Authorization check
    if (req.user.role === "user" && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own complaints",
      });
    }

    const complaints = await Complaint.find({ createdBy: userId })
      .populate("assignedTo", "name email department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Get Complaints By User Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user complaints",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update complaint status
 * @route   PUT /api/complaints/:id/status
 * @access  Private (Staff/Admin)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
      "Rejected",
      "Closed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const previousStatus = complaint.status;

    // Prevent setting same status
    if (previousStatus === status) {
      return res.status(400).json({
        success: false,
        message: `Complaint is already in ${status} status`,
      });
    }

    // Create audit trail in status history
    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      newStatus: status,
      changedBy: req.user._id,
      notes: notes || `Status changed from ${previousStatus} to ${status}`,
    });

    // Update complaint status
    complaint.status = status;

    // Set timestamps based on status
    if (status === "Resolved" && !complaint.resolvedAt) {
      complaint.resolvedAt = Date.now();
    }

    if (status === "Closed" && !complaint.closedAt) {
      complaint.closedAt = Date.now();
    }

    await complaint.save();

    // Populate and return updated complaint
    const updatedComplaint = await Complaint.findById(id)
      .populate("assignedTo", "name email department")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: updatedComplaint,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating complaint status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Assign complaint to staff member
 * @route   PUT /api/complaints/:id/assign
 * @access  Private (Admin only)
 */
exports.assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required for assignment",
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Verify the user exists and is staff/admin
    const User = require("../models/User");
    const assignee = await User.findById(userId);

    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!["staff", "admin"].includes(assignee.role)) {
      return res.status(400).json({
        success: false,
        message: "Can only assign to staff or admin users",
      });
    }

    // Update assignment
    const previousAssignee = complaint.assignedTo;
    complaint.assignedTo = userId;

    // Update status if still pending
    if (complaint.status === "Pending") {
      complaint.status = "In Progress";
    }

    await complaint.save();

    // Create audit trail
    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: complaint.status,
      newStatus: complaint.status,
      changedBy: req.user._id,
      notes: previousAssignee
        ? `Complaint reassigned to ${assignee.name}`
        : `Complaint assigned to ${assignee.name}`,
    });

    // Return updated complaint with populated fields
    const updatedComplaint = await Complaint.findById(id)
      .populate("assignedTo", "name email department role")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Complaint assigned successfully",
      data: updatedComplaint,
    });
  } catch (error) {
    console.error("Assign Complaint Error:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning complaint",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Resolve complaint with resolution notes
 * @route   PUT /api/complaints/:id/resolve
 * @access  Private (Staff/Admin)
 */
exports.resolveComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    if (!resolutionNotes || resolutionNotes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Resolution notes are required",
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.status === "Resolved") {
      return res.status(400).json({
        success: false,
        message: "Complaint is already resolved",
      });
    }

    const previousStatus = complaint.status;

    // Update complaint
    complaint.resolutionNotes = resolutionNotes;
    complaint.status = "Resolved";
    complaint.resolvedAt = Date.now();

    await complaint.save();

    // Create audit trail
    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      newStatus: "Resolved",
      changedBy: req.user._id,
      notes: resolutionNotes,
    });

    // Return updated complaint
    const resolvedComplaint = await Complaint.findById(id)
      .populate("assignedTo", "name email department")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Complaint resolved successfully",
      data: resolvedComplaint,
    });
  } catch (error) {
    console.error("Resolve Complaint Error:", error);
    res.status(500).json({
      success: false,
      message: "Error resolving complaint",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Upload attachments to complaint
 * @route   POST /api/complaints/:id/attachments
 * @access  Private
 */
exports.uploadAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one file",
      });
    }

    // Maximum file limit check
    if (complaint.attachments.length + req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 attachments allowed per complaint",
      });
    }

    // Process uploaded files
    const attachments = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: Date.now(),
    }));

    // Add attachments to complaint
    complaint.attachments.push(...attachments);
    await complaint.save();

    res.status(200).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      data: {
        complaint,
        uploadedFiles: attachments,
      },
    });
  } catch (error) {
    console.error("Upload Attachments Error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading attachments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete complaint and associated files
 * @route   DELETE /api/complaints/:id
 * @access  Private (Admin only)
 */
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Delete associated files from filesystem
    if (complaint.attachments && complaint.attachments.length > 0) {
      for (const file of complaint.attachments) {
        try {
          await fs.unlink(file.path);
          console.log(`✓ Deleted file: ${file.filename}`);
        } catch (fileError) {
          console.error(`Failed to delete file: ${file.filename}`, fileError);
        }
      }
    }

    // Delete status history
    await StatusHistory.deleteMany({ complaintId: complaint._id });

    // Delete complaint
    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: "Complaint and associated data deleted successfully",
    });
  } catch (error) {
    console.error("Delete Complaint Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting complaint",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get comprehensive complaint statistics
 * @route   GET /api/complaints/stats/dashboard
 * @access  Private (Staff/Admin)
 */
exports.getComplaintStats = async (req, res) => {
  try {
    // Use the static method from Complaint model
    const stats = await Complaint.getStats();

    // Additional real-time stats
    const overdueCount = await Complaint.countDocuments({
      status: { $nin: ["Resolved", "Closed"] },
      dueDate: { $lt: new Date() },
    });

    const unassignedCount = await Complaint.countDocuments({
      assignedTo: null,
      status: "Pending",
    });

    // Get recent complaints
    const recentComplaints = await Complaint.find()
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        overdue: overdueCount,
        unassigned: unassignedCount,
        recentComplaints,
      },
    });
  } catch (error) {
    console.error("Get Complaint Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complaint statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update complaint details (title, description, etc.)
 * @route   PUT /api/complaints/:id
 * @access  Private
 */
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority } = req.body;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Authorization: Only creator or staff/admin can update
    if (
      req.user.role === "user" &&
      complaint.createdBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own complaints",
      });
    }

    // Users can't update resolved/closed complaints
    if (
      req.user.role === "user" &&
      ["Resolved", "Closed"].includes(complaint.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot update resolved or closed complaints",
      });
    }

    // Update fields
    if (title) complaint.title = title;
    if (description) complaint.description = description;
    if (category) complaint.category = category;
    if (priority && ["staff", "admin"].includes(req.user.role)) {
      complaint.priority = priority;
    }

    await complaint.save();

    // Create audit entry
    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: complaint.status,
      newStatus: complaint.status,
      changedBy: req.user._id,
      notes: "Complaint details updated",
    });

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Update Complaint Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating complaint",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
