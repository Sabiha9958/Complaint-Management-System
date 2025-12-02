/**
 * StatusHistory Model
 * Tracks complaint status changes with metadata (who changed, when, notes).
 */

const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
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
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    priorityChange: {
      type: String,
      enum: ["low", "medium", "high"],
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Indexes for faster queries
 */
statusHistorySchema.index({ complaint: 1, createdAt: -1 });
statusHistorySchema.index({ changedBy: 1, createdAt: -1 });

/**
 * Virtual: formatted history entry
 */
statusHistorySchema.virtual("summary").get(function () {
  return `Complaint moved from ${this.previousStatus} → ${this.newStatus} by ${this.changedBy}`;
});

/**
 * Method: Check if transition is valid
 */
statusHistorySchema.methods.isValidTransition = function () {
  const validTransitions = {
    pending: ["in_progress", "rejected"],
    in_progress: ["resolved", "rejected", "closed"],
    resolved: ["closed"],
    rejected: ["closed"],
    closed: [],
  };
  return validTransitions[this.previousStatus]?.includes(this.newStatus);
};

/**
 * Pre-save hook: normalize notes
 */
statusHistorySchema.pre("save", function (next) {
  if (this.notes) this.notes = this.notes.trim();
  next();
});

const StatusHistory = mongoose.model("StatusHistory", statusHistorySchema);

module.exports = StatusHistory;
