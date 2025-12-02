/**
 * ================================================================
 * 📋 COMPLAINT MODEL
 * ================================================================
 * Represents user complaints with comprehensive tracking features
 *
 * Features:
 * - Status tracking with history
 * - File attachments management
 * - Comment threads
 * - Assignment workflow
 * - Priority and category classification
 * - Audit trail
 * ================================================================
 */

const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");

// ============================================================================
// SUBDOCUMENT SCHEMAS
// ============================================================================

/**
 * Attachment subdocument schema
 */
const attachmentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "File URL is required"],
    },
    path: {
      type: String,
      required: [true, "File path is required"],
    },
    mimetype: {
      type: String,
      required: [true, "File mimetype is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      max: [10 * 1024 * 1024, "File size cannot exceed 10MB"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: true }
);

/**
 * Comment subdocument schema
 */
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
    isStaffComment: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: true }
);

/**
 * Status history subdocument schema
 */
const statusHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected", "closed"],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected", "closed"],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Status changer is required"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    changedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { _id: true }
);

// ============================================================================
// MAIN COMPLAINT SCHEMA
// ============================================================================

const complaintSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: "text",
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      index: "text",
    },

    // Classification
    category: {
      type: String,
      enum: {
        values: [
          "technical",
          "billing",
          "service",
          "product",
          "harassment",
          "safety",
          "other",
        ],
        message: "{VALUE} is not a valid category",
      },
      default: "other",
      required: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: "General",
      maxlength: [100, "Department name cannot exceed 100 characters"],
      index: true,
    },

    // Status & Priority
    status: {
      type: String,
      enum: {
        values: ["pending", "in_progress", "resolved", "rejected", "closed"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "{VALUE} is not a valid priority",
      },
      default: "medium",
      required: true,
      index: true,
    },

    // Additional Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    // User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    // Contact Information (embedded document)
    contactInfo: {
      name: {
        type: String,
        required: [true, "Contact name is required"],
        trim: true,
        minlength: [2, "Contact name must be at least 2 characters"],
        maxlength: [100, "Contact name cannot exceed 100 characters"],
      },
      email: {
        type: String,
        required: [true, "Contact email is required"],
        trim: true,
        lowercase: true,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          "Please provide a valid email address",
        ],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit phone number"],
      },
    },

    // File Attachments
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: "Cannot have more than 10 attachments per complaint",
      },
    },

    // Comments Thread
    comments: {
      type: [commentSchema],
      default: [],
    },

    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedAt: Date,

    // Status History
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // Flags & Metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Resolution Information
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution note cannot exceed 1000 characters"],
    },

    // Rejection Information
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Rejection reason cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// ============================================================================
// INDEXES (Compound indexes for common query patterns)
// ============================================================================

// Compound indexes following ESR rule (Equality, Sort, Range)
complaintSchema.index({ user: 1, status: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: -1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, department: 1 });
complaintSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });
complaintSchema.index({ "contactInfo.email": 1 });

// Text index for search
complaintSchema.index(
  { title: "text", description: "text" },
  {
    weights: {
      title: 10,
      description: 5,
    },
    name: "complaint_text_index",
  }
);

// ============================================================================
// VIRTUALS
// ============================================================================

/**
 * Virtual: Short summary for list views
 */
complaintSchema.virtual("summary").get(function () {
  const maxLength = 50;
  const truncated =
    this.title.length > maxLength
      ? `${this.title.substring(0, maxLength)}...`
      : this.title;
  return `${truncated} (${this.status})`;
});

/**
 * Virtual: Attachment count
 */
complaintSchema.virtual("attachmentCount").get(function () {
  return this.attachments?.length || 0;
});

/**
 * Virtual: Comment count
 */
complaintSchema.virtual("commentCount").get(function () {
  return this.comments?.length || 0;
});

/**
 * Virtual: Days since created
 */
complaintSchema.virtual("daysSinceCreated").get(function () {
  const days = Math.floor(
    (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)
  );
  return days;
});

/**
 * Virtual: Is overdue (pending for more than 7 days)
 */
complaintSchema.virtual("isOverdue").get(function () {
  if (this.status !== "pending") return false;
  const daysOpen = this.daysSinceCreated;
  return daysOpen > 7;
});

/**
 * Virtual: Staff comment count
 */
complaintSchema.virtual("staffCommentCount").get(function () {
  return this.comments?.filter((c) => c.isStaffComment).length || 0;
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Check if complaint is still open
 */
complaintSchema.methods.isOpen = function () {
  return ["pending", "in_progress"].includes(this.status);
};

/**
 * Check if complaint is closed
 */
complaintSchema.methods.isClosed = function () {
  return ["resolved", "rejected", "closed"].includes(this.status);
};

/**
 * Check if user can edit complaint
 */
complaintSchema.methods.canEdit = function (userId) {
  if (!userId) return false;
  const userIdStr = userId.toString();
  const ownerIdStr = this.user.toString();

  return userIdStr === ownerIdStr && this.status === "pending";
};

/**
 * Check if user can delete complaint
 */
complaintSchema.methods.canDelete = function (userId, userRole) {
  if (!userId) return false;

  // Admins can delete any complaint
  if (userRole === "admin") return true;

  // Users can only delete their own pending complaints
  const userIdStr = userId.toString();
  const ownerIdStr = this.user.toString();
  return userIdStr === ownerIdStr && this.status === "pending";
};

/**
 * Update status with history tracking
 */
complaintSchema.methods.updateStatus = async function (
  newStatus,
  changedBy,
  note = ""
) {
  const previousStatus = this.status;

  // Don't create history entry if status hasn't changed
  if (previousStatus === newStatus) {
    return this;
  }

  // Add to status history
  this.statusHistory.push({
    previousStatus,
    newStatus,
    changedBy,
    note: note.trim(),
    changedAt: new Date(),
  });

  // Update status
  this.status = newStatus;

  // Handle status-specific actions
  switch (newStatus) {
    case "resolved":
      this.resolvedAt = new Date();
      this.resolvedBy = changedBy;
      if (note) this.resolutionNote = note.trim();
      break;

    case "rejected":
      this.rejectedAt = new Date();
      this.rejectedBy = changedBy;
      if (note) this.rejectionReason = note.trim();
      break;

    case "in_progress":
      // Auto-assign if not already assigned
      if (!this.assignedTo) {
        this.assignedTo = changedBy;
        this.assignedAt = new Date();
      }
      break;
  }

  await this.save();
  logger.info(
    `📝 Complaint ${this._id} status changed: ${previousStatus} → ${newStatus}`
  );

  return this;
};

/**
 * Assign complaint to user
 */
complaintSchema.methods.assignTo = async function (userId) {
  if (!userId) {
    throw new Error("User ID is required for assignment");
  }

  this.assignedTo = userId;
  this.assignedAt = new Date();

  // Auto-update status to in_progress if pending
  if (this.status === "pending") {
    this.status = "in_progress";
  }

  await this.save();
  logger.info(`👤 Complaint ${this._id} assigned to ${userId}`);

  return this;
};

/**
 * Add comment
 */
complaintSchema.methods.addComment = async function (
  userId,
  text,
  isStaff = false
) {
  if (!userId) {
    throw new Error("User ID is required for comment");
  }

  if (!text || !text.trim()) {
    throw new Error("Comment text cannot be empty");
  }

  const comment = {
    user: userId,
    text: text.trim(),
    isStaffComment: isStaff,
    createdAt: new Date(),
  };

  this.comments.push(comment);
  await this.save();

  logger.info(
    `💬 Comment added to complaint ${this._id} by ${userId}${
      isStaff ? " (staff)" : ""
    }`
  );

  return this.comments[this.comments.length - 1];
};

/**
 * Edit comment
 */
complaintSchema.methods.editComment = async function (
  commentId,
  newText,
  userId
) {
  const comment = this.comments.id(commentId);

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Check if user owns the comment
  if (comment.user.toString() !== userId.toString()) {
    throw new Error("You can only edit your own comments");
  }

  comment.text = newText.trim();
  comment.isEdited = true;
  comment.editedAt = new Date();

  await this.save();
  return comment;
};

/**
 * Delete comment
 */
complaintSchema.methods.deleteComment = async function (
  commentId,
  userId,
  userRole
) {
  const comment = this.comments.id(commentId);

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Only comment owner or admin can delete
  const canDelete =
    comment.user.toString() === userId.toString() || userRole === "admin";

  if (!canDelete) {
    throw new Error("You do not have permission to delete this comment");
  }

  comment.remove();
  await this.save();

  logger.info(`🗑️ Comment ${commentId} deleted from complaint ${this._id}`);
};

/**
 * Add attachment
 */
complaintSchema.methods.addAttachment = async function (file, req) {
  if (!file) {
    throw new Error("File is required");
  }

  // Check attachment limit
  if (this.attachments.length >= 10) {
    throw new Error("Maximum 10 attachments allowed per complaint");
  }

  const baseUrl =
    process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

  const attachment = {
    filename: file.filename,
    originalName: file.originalname,
    url: `${baseUrl}/uploads/complaints/${file.filename}`,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };

  this.attachments.push(attachment);
  await this.save();

  logger.info(
    `📎 Attachment added to complaint ${this._id}: ${file.originalname}`
  );

  return attachment;
};

/**
 * Delete attachment with file cleanup
 */
complaintSchema.methods.deleteAttachment = async function (attachmentId) {
  const attachment = this.attachments.id(attachmentId);

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  // Delete file from filesystem
  try {
    await fs.unlink(attachment.path);
    logger.info(`🗑️ File deleted: ${attachment.path}`);
  } catch (error) {
    logger.error(`❌ Error deleting file: ${error.message}`);
    // Continue with DB deletion even if file delete fails
  }

  attachment.remove();
  await this.save();

  logger.info(
    `📎 Attachment ${attachmentId} removed from complaint ${this._id}`
  );
};

/**
 * Soft delete complaint
 */
complaintSchema.methods.softDelete = async function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.isActive = false;

  await this.save();
  logger.info(`🗑️ Complaint ${this._id} soft deleted by ${deletedBy}`);

  return this;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find complaints by user
 */
complaintSchema.statics.findByUser = function (userId, options = {}) {
  const query = {
    user: userId,
    isDeleted: { $ne: true },
  };

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50);
};

/**
 * Find overdue complaints
 */
complaintSchema.statics.findOverdue = function (days = 7) {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - days);

  return this.find({
    status: "pending",
    createdAt: { $lt: overdueDate },
    isDeleted: { $ne: true },
  }).sort({ createdAt: 1 });
};

/**
 * Get complaint statistics
 */
complaintSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $match: { isDeleted: { $ne: true } },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    closed: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// ============================================================================
// MIDDLEWARE HOOKS
// ============================================================================

/**
 * Pre-save: Normalize and validate data
 */
complaintSchema.pre("save", function (next) {
  // Normalize strings
  if (this.title) this.title = this.title.trim();
  if (this.description) this.description = this.description.trim();
  if (this.notes) this.notes = this.notes.trim();
  if (this.department) this.department = this.department.trim();
  if (this.resolutionNote) this.resolutionNote = this.resolutionNote.trim();
  if (this.rejectionReason) this.rejectionReason = this.rejectionReason.trim();

  // Normalize contact info
  if (this.contactInfo) {
    if (this.contactInfo.name) {
      this.contactInfo.name = this.contactInfo.name.trim();
    }
    if (this.contactInfo.email) {
      this.contactInfo.email = this.contactInfo.email.toLowerCase().trim();
    }
  }

  next();
});

/**
 * Pre-save: Log changes
 */
complaintSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    logger.debug(`📝 Complaint ${this._id} modified`);
  }
  next();
});

/**
 * Post-save: Log creation
 */
complaintSchema.post("save", function (doc) {
  if (doc.isNew) {
    logger.info(`✅ New complaint created: ${doc._id} by user ${doc.user}`);
  }
});

/**
 * Pre-remove: Clean up attachments
 */
complaintSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    try {
      // Delete all attachment files
      if (this.attachments && this.attachments.length > 0) {
        const deletePromises = this.attachments.map(async (attachment) => {
          try {
            await fs.unlink(attachment.path);
            logger.info(`🗑️ File deleted: ${attachment.path}`);
          } catch (error) {
            logger.error(
              `❌ Error deleting file ${attachment.path}: ${error.message}`
            );
          }
        });

        await Promise.allSettled(deletePromises);
      }

      logger.info(`🗑️ Complaint ${this._id} and attachments deleted`);
    } catch (error) {
      logger.error(`❌ Error in pre-remove hook: ${error.message}`);
    }
  }
);

/**
 * Pre-deleteMany: Warn about bulk deletion
 */
complaintSchema.pre("deleteMany", function (next) {
  logger.warn(
    "⚠️ Bulk delete operation on complaints - attachments may not be cleaned up"
  );
  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
