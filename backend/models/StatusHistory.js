/**
 * Status History Model
 * Tracks all status changes for audit trail
 */

const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "Complaint ID is required"],
      index: true,
    },
    previousStatus: {
      type: String,
      required: [true, "Previous status is required"],
    },
    newStatus: {
      type: String,
      required: [true, "New status is required"],
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Changed by user ID is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We're using custom timestamp field
  }
);

// Compound index for efficient queries
statusHistorySchema.index({ complaintId: 1, timestamp: -1 });

/**
 * Static method to get status history for a complaint
 */
statusHistorySchema.statics.getComplaintHistory = async function (complaintId) {
  return await this.find({ complaintId })
    .populate("changedBy", "name email role")
    .sort({ timestamp: -1 });
};

module.exports = mongoose.model("StatusHistory", statusHistorySchema);
