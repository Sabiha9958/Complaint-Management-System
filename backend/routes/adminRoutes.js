/**
 * ════════════════════════════════════════════════════════════════
 * 🔐 ADMIN ROUTES - COMPREHENSIVE MANAGEMENT SYSTEM
 * ════════════════════════════════════════════════════════════════
 * Full admin panel routes including:
 * - Dashboard analytics and statistics
 * - User management (CRUD operations)
 * - Complaint management and resolution
 * - Advanced reporting and exports
 * - System configuration and monitoring
 */

const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/UserModel");
const { protect, authorize } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// Apply protection and admin authorization to all routes
router.use(protect);
router.use(authorize("admin"));

/* ========================================================================
 * 📊 DASHBOARD STATISTICS & ANALYTICS
 * ===================================================================== */

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Private/Admin
 */
router.get("/dashboard/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Parallel data fetching for better performance
    const [
      totalUsers,
      activeUsers,
      totalComplaints,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      resolvedToday,
      resolvedYesterday,
      newUsersToday,
      newUsersThisWeek,
      newUsersLastWeek,
      complaintsToday,
      complaintsThisWeek,
      complaintsLastWeek,
      highPriorityComplaints,
      averageRating,
    ] = await Promise.all([
      // User statistics
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isActive: true, isDeleted: false }),

      // Complaint statistics
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "open" }),
      Complaint.countDocuments({ status: "in-progress" }),
      Complaint.countDocuments({ status: "resolved" }),
      Complaint.countDocuments({
        status: "resolved",
        updatedAt: { $gte: today },
      }),
      Complaint.countDocuments({
        status: "resolved",
        updatedAt: { $gte: yesterday, $lt: today },
      }),

      // User growth
      User.countDocuments({
        createdAt: { $gte: today },
        isDeleted: false,
      }),
      User.countDocuments({
        createdAt: { $gte: lastWeek },
        isDeleted: false,
      }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lt: lastWeek,
        },
        isDeleted: false,
      }),

      // Complaint trends
      Complaint.countDocuments({ createdAt: { $gte: today } }),
      Complaint.countDocuments({ createdAt: { $gte: lastWeek } }),
      Complaint.countDocuments({
        createdAt: {
          $gte: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lt: lastWeek,
        },
      }),

      // Priority complaints
      Complaint.countDocuments({
        priority: "high",
        status: { $ne: "resolved" },
      }),

      // Average satisfaction rating
      Complaint.aggregate([
        { $match: { rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
    ]);

    // Calculate average response time
    const complaintsWithResponse = await Complaint.find({
      status: { $in: ["in-progress", "resolved"] },
      updatedAt: { $exists: true },
    })
      .select("createdAt updatedAt")
      .limit(100)
      .lean();

    let totalResponseTime = 0;
    let validComplaints = 0;

    complaintsWithResponse.forEach((complaint) => {
      const responseTime =
        new Date(complaint.updatedAt) - new Date(complaint.createdAt);
      if (responseTime > 0) {
        totalResponseTime += responseTime;
        validComplaints++;
      }
    });

    const avgResponseMs =
      validComplaints > 0 ? totalResponseTime / validComplaints : 0;
    const avgResponseHours = (avgResponseMs / (1000 * 60 * 60)).toFixed(1);

    // Calculate growth percentages
    const userGrowthRate =
      newUsersLastWeek > 0
        ? (
            ((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) *
            100
          ).toFixed(1)
        : newUsersThisWeek > 0
        ? "100.0"
        : "0.0";

    const complaintGrowthRate =
      complaintsLastWeek > 0
        ? (
            ((complaintsThisWeek - complaintsLastWeek) / complaintsLastWeek) *
            100
          ).toFixed(1)
        : complaintsThisWeek > 0
        ? "100.0"
        : "0.0";

    const openPercentage =
      totalComplaints > 0
        ? ((openComplaints / totalComplaints) * 100).toFixed(1)
        : "0.0";

    const resolutionRate =
      totalComplaints > 0
        ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
        : "0.0";

    const resolutionTrend =
      resolvedYesterday > 0
        ? (
            ((resolvedToday - resolvedYesterday) / resolvedYesterday) *
            100
          ).toFixed(1)
        : resolvedToday > 0
        ? "100.0"
        : "0.0";

    // Category distribution
    const categoryDistribution = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Status distribution over time (last 7 days)
    const statusTrend = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        // Overview metrics
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          totalComplaints,
          newUsersToday,
          complaintsToday,
        },

        // User metrics
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          growthRate: `${userGrowthRate > 0 ? "+" : ""}${userGrowthRate}%`,
        },

        // Complaint metrics
        complaints: {
          total: totalComplaints,
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          highPriority: highPriorityComplaints,
          newToday: complaintsToday,
          newThisWeek: complaintsThisWeek,
          growthRate: `${
            complaintGrowthRate > 0 ? "+" : ""
          }${complaintGrowthRate}%`,
        },

        // Performance metrics
        performance: {
          avgResponseTime: `${avgResponseHours}h`,
          avgResponseTimeMs: avgResponseMs,
          resolvedToday,
          resolutionRate: `${resolutionRate}%`,
          resolutionTrend: `${
            resolutionTrend > 0 ? "+" : ""
          }${resolutionTrend}%`,
          openPercentage: `${openPercentage}%`,
          responseImprovement:
            avgResponseHours < 2
              ? "↗ Better"
              : avgResponseHours < 6
              ? "→ Normal"
              : "↘ Slower",
          avgSatisfactionRating:
            averageRating[0]?.avgRating?.toFixed(1) || "N/A",
        },

        // Distribution data
        distribution: {
          byCategory: categoryDistribution.map((item) => ({
            category: item._id,
            count: item.count,
            percentage: ((item.count / totalComplaints) * 100).toFixed(1),
          })),
          byStatus: {
            open: { count: openComplaints, percentage: openPercentage },
            inProgress: {
              count: inProgressComplaints,
              percentage:
                totalComplaints > 0
                  ? ((inProgressComplaints / totalComplaints) * 100).toFixed(1)
                  : "0.0",
            },
            resolved: {
              count: resolvedComplaints,
              percentage: resolutionRate,
            },
          },
        },

        // Trends
        trends: {
          statusOverTime: statusTrend,
        },
      },
    });

    logger.info(`✅ Dashboard stats fetched by admin: ${req.user.email}`);
  } catch (error) {
    logger.error(`❌ Error fetching dashboard stats: ${error.message}`, {
      error,
    });
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to fetch dashboard statistics",
      code: "STATS_FETCH_ERROR",
    });
  }
});

/**
 * @route   GET /api/admin/dashboard/charts
 * @desc    Get chart data for dashboard visualizations
 * @access  Private/Admin
 */
router.get("/dashboard/charts", async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    // Calculate date range based on period
    let dateFrom;
    switch (period) {
      case "24h":
        dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Complaints over time
    const complaintsOverTime = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Status distribution by day
    const statusByDay = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Priority distribution
    const priorityDistribution = await Complaint.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Resolution time analysis
    const resolutionTimeAnalysis = await Complaint.aggregate([
      {
        $match: {
          status: "resolved",
          updatedAt: { $gte: dateFrom },
        },
      },
      {
        $project: {
          resolutionTime: {
            $subtract: ["$updatedAt", "$createdAt"],
          },
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
          },
        },
      },
      {
        $group: {
          _id: "$date",
          avgResolutionTime: { $avg: "$resolutionTime" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      period,
      dateFrom: dateFrom.toISOString(),
      charts: {
        complaintsOverTime: complaintsOverTime.map((item) => ({
          date: item._id,
          count: item.count,
        })),
        statusByDay: statusByDay.map((item) => ({
          date: item._id.date,
          status: item._id.status,
          count: item.count,
        })),
        priorityDistribution: priorityDistribution.map((item) => ({
          priority: item._id,
          count: item.count,
        })),
        resolutionTimeAnalysis: resolutionTimeAnalysis.map((item) => ({
          date: item._id,
          avgTimeHours: (item.avgResolutionTime / (1000 * 60 * 60)).toFixed(2),
          count: item.count,
        })),
      },
    });

    logger.info(
      `✅ Chart data fetched by admin: ${req.user.email} for period: ${period}`
    );
  } catch (error) {
    logger.error(`❌ Error fetching chart data: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
    });
  }
});

/* ========================================================================
 * 👥 USER MANAGEMENT
 * ===================================================================== */

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters and pagination
 * @access  Private/Admin
 */
router.get("/users", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      status = "",
      sort = "-createdAt",
    } = req.query;

    const query = { isDeleted: false };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Role filter
    if (role) query.role = role;

    // Status filter
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const users = await User.find(query)
      .select("-password -refreshToken -__v")
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Get complaint counts for each user
    const userIds = users.map((user) => user._id);
    const complaintCounts = await Complaint.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);

    const complaintCountMap = {};
    complaintCounts.forEach((item) => {
      complaintCountMap[item._id.toString()] = item.count;
    });

    const usersWithStats = users.map((user) => ({
      ...user,
      complaintCount: complaintCountMap[user._id.toString()] || 0,
    }));

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      filters: { search, role, status, sort },
    });

    logger.info(`✅ Users list fetched by admin: ${req.user.email}`);
  } catch (error) {
    logger.error(`❌ Error fetching users: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details with complaints history
 * @access  Private/Admin
 */
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -refreshToken -__v")
      .lean();

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's complaints
    const complaints = await Complaint.find({ user: req.params.id })
      .select("title category status priority createdAt updatedAt")
      .sort("-createdAt")
      .limit(10)
      .lean();

    // Get user statistics
    const [totalComplaints, openComplaints, resolvedComplaints] =
      await Promise.all([
        Complaint.countDocuments({ user: req.params.id }),
        Complaint.countDocuments({ user: req.params.id, status: "open" }),
        Complaint.countDocuments({ user: req.params.id, status: "resolved" }),
      ]);

    res.json({
      success: true,
      user: {
        ...user,
        statistics: {
          totalComplaints,
          openComplaints,
          resolvedComplaints,
          resolutionRate:
            totalComplaints > 0
              ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
              : "0.0",
        },
        recentComplaints: complaints,
      },
    });

    logger.info(
      `✅ User details fetched by admin: ${req.user.email} for user: ${req.params.id}`
    );
  } catch (error) {
    logger.error(`❌ Error fetching user details: ${error.message}`, {
      error,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details
 * @access  Private/Admin
 */
router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, role, isActive, phone } = req.body;

    const user = await User.findById(req.params.id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });

    logger.info(
      `✅ User updated by admin: ${req.user.email} - Updated user: ${user.email}`
    );
  } catch (error) {
    logger.error(`❌ Error updating user: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private/Admin
 */
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "User deleted successfully",
    });

    logger.warn(
      `⚠️ User deleted by admin: ${req.user.email} - Deleted user: ${user.email}`
    );
  } catch (error) {
    logger.error(`❌ Error deleting user: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

/* ========================================================================
 * 📋 COMPLAINT MANAGEMENT
 * ===================================================================== */

/**
 * @route   GET /api/admin/complaints
 * @desc    Get all complaints with advanced filters
 * @access  Private/Admin
 */
router.get("/complaints", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sort = "-createdAt",
      status,
      priority,
      category,
      search = "",
      dateFrom,
      dateTo,
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== "all") query.status = status;

    // Filter by priority
    if (priority && priority !== "all") query.priority = priority;

    // Filter by category
    if (category && category !== "all") query.category = category;

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const complaints = await Complaint.find(query)
      .populate("user", "name email phone avatar")
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Complaint.countDocuments(query);

    res.json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      filters: { status, priority, category, search, dateFrom, dateTo, sort },
    });

    logger.info(`✅ Complaints list fetched by admin: ${req.user.email}`);
  } catch (error) {
    logger.error(`❌ Error fetching complaints: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
});

/**
 * @route   GET /api/admin/complaints/:id
 * @desc    Get single complaint details
 * @access  Private/Admin
 */
router.get("/complaints/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "name email phone avatar")
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      complaint,
    });

    logger.info(
      `✅ Complaint details fetched by admin: ${req.user.email} for complaint: ${req.params.id}`
    );
  } catch (error) {
    logger.error(`❌ Error fetching complaint: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaint details",
    });
  }
});

/**
 * @route   PUT /api/admin/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private/Admin
 */
router.put("/complaints/:id/status", async (req, res) => {
  try {
    const { status, adminNote, priority } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updateData = {
      status,
      updatedAt: Date.now(),
      lastUpdatedBy: req.user._id,
    };

    if (adminNote) updateData.adminNote = adminNote;
    if (priority) updateData.priority = priority;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("user", "name email")
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: "Complaint updated successfully",
      complaint,
    });

    logger.info(
      `✅ Complaint status updated by admin: ${req.user.email} - Complaint: ${req.params.id} - New status: ${status}`
    );
  } catch (error) {
    logger.error(`❌ Error updating complaint: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to update complaint",
    });
  }
});

/**
 * @route   PUT /api/admin/complaints/:id
 * @desc    Update complaint details
 * @access  Private/Admin
 */
router.put("/complaints/:id", async (req, res) => {
  try {
    const { title, description, category, priority, status, adminNote } =
      req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Update fields
    if (title) complaint.title = title;
    if (description) complaint.description = description;
    if (category) complaint.category = category;
    if (priority) complaint.priority = priority;
    if (status) complaint.status = status;
    if (adminNote) complaint.adminNote = adminNote;

    complaint.updatedAt = Date.now();
    complaint.lastUpdatedBy = req.user._id;

    await complaint.save();

    const updatedComplaint = await Complaint.findById(req.params.id)
      .populate("user", "name email")
      .lean();

    res.json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });

    logger.info(
      `✅ Complaint updated by admin: ${req.user.email} - Complaint: ${req.params.id}`
    );
  } catch (error) {
    logger.error(`❌ Error updating complaint: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to update complaint",
    });
  }
});

/**
 * @route   DELETE /api/admin/complaints/:id
 * @desc    Delete complaint
 * @access  Private/Admin
 */
router.delete("/complaints/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: "Complaint deleted successfully",
    });

    logger.warn(
      `⚠️ Complaint deleted by admin: ${req.user.email} - Complaint: ${req.params.id}`
    );
  } catch (error) {
    logger.error(`❌ Error deleting complaint: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to delete complaint",
    });
  }
});

/**
 * @route   POST /api/admin/complaints/bulk-update
 * @desc    Bulk update complaint status
 * @access  Private/Admin
 */
router.post("/complaints/bulk-update", async (req, res) => {
  try {
    const { complaintIds, status, priority, adminNote } = req.body;

    if (
      !complaintIds ||
      !Array.isArray(complaintIds) ||
      complaintIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide complaint IDs",
      });
    }

    const updateData = {
      updatedAt: Date.now(),
      lastUpdatedBy: req.user._id,
    };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNote) updateData.adminNote = adminNote;

    const result = await Complaint.updateMany(
      { _id: { $in: complaintIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} complaints updated successfully`,
      updated: result.modifiedCount,
    });

    logger.info(
      `✅ Bulk complaint update by admin: ${req.user.email} - Updated ${result.modifiedCount} complaints`
    );
  } catch (error) {
    logger.error(`❌ Error in bulk update: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to update complaints",
    });
  }
});

/* ========================================================================
 * 📊 REPORTS & ANALYTICS
 * ===================================================================== */

/**
 * @route   GET /api/admin/reports/summary
 * @desc    Get comprehensive system summary report
 * @access  Private/Admin
 */
router.get("/reports/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchQuery =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Category-wise report
    const categoryReport = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$category",
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
          medium: {
            $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] },
          },
          low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // User activity report
    const userActivityReport = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$user",
          totalComplaints: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          userName: "$userInfo.name",
          userEmail: "$userInfo.email",
          totalComplaints: 1,
          resolved: 1,
          open: 1,
          resolutionRate: {
            $multiply: [{ $divide: ["$resolved", "$totalComplaints"] }, 100],
          },
        },
      },
      { $sort: { totalComplaints: -1 } },
      { $limit: 20 },
    ]);

    // Daily statistics
    const dailyStats = await Complaint.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      report: {
        dateRange: {
          startDate: startDate || "all time",
          endDate: endDate || "present",
        },
        categoryReport,
        userActivityReport,
        dailyStats,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.email,
    });

    logger.info(`✅ Summary report generated by admin: ${req.user.email}`);
  } catch (error) {
    logger.error(`❌ Error generating report: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
    });
  }
});

/**
 * @route   GET /api/admin/reports/export
 * @desc    Export complaints data (CSV format)
 * @access  Private/Admin
 */
router.get("/reports/export", async (req, res) => {
  try {
    const { status, priority, category, dateFrom, dateTo } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const complaints = await Complaint.find(query)
      .populate("user", "name email phone")
      .select("title description category status priority createdAt updatedAt")
      .lean();

    // Convert to CSV format
    const csvHeader =
      "ID,Title,Description,Category,Status,Priority,User Name,User Email,Created At,Updated At\n";
    const csvRows = complaints
      .map(
        (c) =>
          `"${c._id}","${c.title}","${c.description}","${c.category}","${
            c.status
          }","${c.priority}","${c.user?.name || "N/A"}","${
            c.user?.email || "N/A"
          }","${c.createdAt}","${c.updatedAt}"`
      )
      .join("\n");

    const csv = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=complaints-export-${Date.now()}.csv`
    );
    res.send(csv);

    logger.info(
      `✅ Data exported by admin: ${req.user.email} - ${complaints.length} records`
    );
  } catch (error) {
    logger.error(`❌ Error exporting data: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "Failed to export data",
    });
  }
});

/* ========================================================================
 * ⚙️ SYSTEM CONFIGURATION & MONITORING
 * ===================================================================== */

/**
 * @route   GET /api/admin/system/health
 * @desc    Get detailed system health status
 * @access  Private/Admin
 */
router.get("/system/health", async (req, res) => {
  try {
    const [userCount, complaintCount, dbStats] = await Promise.all([
      User.estimatedDocumentCount(),
      Complaint.estimatedDocumentCount(),
      mongoose.connection.db.stats(),
    ]);

    res.json({
      success: true,
      system: {
        database: {
          status: "connected",
          collections: {
            users: userCount,
            complaints: complaintCount,
          },
          storage: {
            dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
            indexSize: `${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`,
            totalSize: `${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`,
          },
        },
        server: {
          uptime: Math.floor(process.uptime()),
          memory: {
            used: `${Math.round(
              process.memoryUsage().heapUsed / 1024 / 1024
            )} MB`,
            total: `${Math.round(
              process.memoryUsage().heapTotal / 1024 / 1024
            )} MB`,
          },
          nodeVersion: process.version,
          platform: process.platform,
        },
      },
      timestamp: new Date().toISOString(),
    });

    logger.info(`✅ System health checked by admin: ${req.user.email}`);
  } catch (error) {
    logger.error(`❌ Error checking system health: ${error.message}`, {
      error,
    });
    res.status(500).json({
      success: false,
      message: "Failed to check system health",
    });
  }
});

/**
 * @route   GET /api/admin/activity-log
 * @desc    Get recent admin activity log (for future implementation)
 * @access  Private/Admin
 */
router.get("/activity-log", async (req, res) => {
  try {
    // TODO: Implement activity logging system
    res.json({
      success: true,
      message: "Activity log feature coming soon",
      activities: [],
    });
  } catch (error) {
    logger.error(`❌ Error fetching activity log: ${error.message}`, {
      error,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity log",
    });
  }
});

module.exports = router;
