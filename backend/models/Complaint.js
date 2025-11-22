/**
 * Complaint Model
 * Defines complaint schema with validation and business logic
 */

const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      required: [true, "Complaint ID is required"],
      index: true, // Index for faster lookups
    },
    title: {
      type: String,
      required: [true, "Please provide a complaint title"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a detailed description"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: {
        values: [
          "Infrastructure",
          "Academic",
          "Hostel",
          "Transport",
          "Canteen",
          "Library",
          "IT Services",
          "Security",
          "Other",
        ],
        message: "{VALUE} is not a valid category",
      },
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High", "Critical"],
        message: "{VALUE} is not a valid priority level",
      },
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "In Progress", "Resolved", "Rejected", "Closed"],
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
      index: true,
    },
    contactInfo: {
      name: {
        type: String,
        required: [true, "Contact name is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Contact email is required"],
        lowercase: true,
        trim: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please provide a valid email address",
        ],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
        default: null,
      },
    },
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        mimetype: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution notes cannot exceed 1000 characters"],
      default: null,
    },
    dueDate: {
      type: Date,
      default: function () {
        // Set due date based on priority
        const priorityDays = {
          Critical: 1,
          High: 3,
          Medium: 7,
          Low: 14,
        };
        const days = priorityDays[this.priority] || 7;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      },
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for complex queries
complaintSchema.index({ status: 1, priority: -1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ createdBy: 1, createdAt: -1 });

// Text index for search functionality
complaintSchema.index({
  title: "text",
  description: "text",
  complaintId: "text",
});

/**
 * Virtual property to calculate if complaint is overdue
 */
complaintSchema.virtual("isOverdue").get(function () {
  if (this.status === "Resolved" || this.status === "Closed") {
    return false;
  }
  return this.dueDate < new Date();
});

/**
 * Virtual property to calculate resolution time
 */
complaintSchema.virtual("resolutionTime").get(function () {
  if (this.resolvedAt) {
    return Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60 * 60)); // Hours
  }
  return null;
});

/**
 * Pre-save middleware to generate complaint ID if not exists
 */
complaintSchema.pre("save", function (next) {
  if (!this.complaintId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.complaintId = `CMP${timestamp}${random}`;
  }
  next();
});

/**
 * Pre-save middleware to set resolved/closed timestamps
 */
complaintSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "Resolved" && !this.resolvedAt) {
      this.resolvedAt = Date.now();
    }
    if (this.status === "Closed" && !this.closedAt) {
      this.closedAt = Date.now();
    }
  }
  next();
});

/**
 * Static method to get complaint statistics
 */
complaintSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $facet: {
        statusStats: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        categoryStats: [
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        priorityStats: [
          { $group: { _id: "$priority", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        overallStats: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              resolved: {
                $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
              },
              pending: {
                $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
              },
              inProgress: {
                $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
              },
              avgResolutionTime: {
                $avg: {
                  $cond: [
                    { $ne: ["$resolvedAt", null] },
                    {
                      $divide: [
                        { $subtract: ["$resolvedAt", "$createdAt"] },
                        3600000,
                      ],
                    },
                    null,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  return stats[0];
};

module.exports = mongoose.model("Complaint", complaintSchema);
