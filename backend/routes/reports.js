/**
 * Reports Routes
 * Handles report generation and analytics
 */

const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

/**
 * @desc    Get comprehensive reports data
 * @route   GET /api/reports
 * @access  Private (Admin/Staff)
 */
router.get("/", protect, authorize("admin", "staff"), async (req, res) => {
  try {
    const { startDate, endDate, type = "all" } = req.query;

    // Date range filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const hasDateFilter = startDate || endDate;

    // Complaints statistics
    const complaintStats = await Complaint.aggregate([
      ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $facet: {
          statusBreakdown: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          categoryBreakdown: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          priorityBreakdown: [
            { $group: { _id: "$priority", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 12 },
          ],
          averageResolutionTime: [
            {
              $match: { resolvedAt: { $ne: null } },
            },
            {
              $project: {
                resolutionTime: {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$createdAt"] },
                    3600000, // Convert to hours
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: "$resolutionTime" },
              },
            },
          ],
        },
      },
    ]);

    // User statistics
    const userStats = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ isActive: true }),
      byRole: await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    };

    // Recent activity
    const recentComplaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    res.status(200).json({
      success: true,
      data: {
        complaints: complaintStats[0],
        users: userStats,
        recentActivity: recentComplaints,
        generatedAt: new Date(),
        dateRange: hasDateFilter ? { startDate, endDate } : "all-time",
      },
    });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating reports",
    });
  }
});

module.exports = router;
