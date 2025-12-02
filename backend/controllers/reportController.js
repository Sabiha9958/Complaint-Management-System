/**
 * Report Controller
 * Handles complaint and user statistics reporting, including CSV/Excel exports.
 */

const Complaint = require("../models/Complaint");
const User = require("../models/UserModel");
const logger = require("../utils/logger");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");

/**
 * Get complaint statistics for dashboard
 * @route GET /api/reports/complaints-stats
 * @access Private (Admin/Staff)
 */
exports.getComplaintStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const result = {
      total: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      closed: 0,
    };

    stats.forEach(({ _id, count }) => {
      result[_id] = count;
      result.total += count;
    });

    return res.status(200).json({ success: true, stats: result });
  } catch (error) {
    logger.error("Get complaint stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint statistics.",
    });
  }
};

/**
 * Get user role statistics for dashboard
 * @route GET /api/reports/users-stats
 * @access Private (Admin/Staff)
 */
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const result = { total: 0, admin: 0, staff: 0, user: 0 };

    stats.forEach(({ _id, count }) => {
      result[_id] = count;
      result.total += count;
    });

    return res.status(200).json({ success: true, stats: result });
  } catch (error) {
    logger.error("Get user stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics.",
    });
  }
};

/**
 * Export complaint statistics as CSV
 * @route GET /api/reports/complaints-stats/csv
 * @access Private (Admin/Staff)
 */
exports.exportComplaintStatsCSV = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const parser = new Parser({ fields: ["_id", "count"] });
    const csv = parser.parse(stats);

    res.header("Content-Type", "text/csv");
    res.attachment("complaint-stats.csv");
    return res.send(csv);
  } catch (error) {
    logger.error("Export complaint stats CSV error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export complaint stats CSV",
    });
  }
};

/**
 * Export user role statistics as CSV
 * @route GET /api/reports/users-stats/csv
 * @access Private (Admin/Staff)
 */
exports.exportUserStatsCSV = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const parser = new Parser({ fields: ["_id", "count"] });
    const csv = parser.parse(stats);

    res.header("Content-Type", "text/csv");
    res.attachment("user-stats.csv");
    return res.send(csv);
  } catch (error) {
    logger.error("Export user stats CSV error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export user stats CSV",
    });
  }
};

/**
 * Export complaint statistics as Excel
 * @route GET /api/reports/complaints-stats/excel
 * @access Private (Admin/Staff)
 */
exports.exportComplaintStatsExcel = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const worksheet = XLSX.utils.json_to_sheet(stats);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ComplaintStats");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.attachment("complaint-stats.xlsx");
    return res.send(buffer);
  } catch (error) {
    logger.error("Export complaint stats Excel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export complaint stats Excel",
    });
  }
};

/**
 * Export user role statistics as Excel
 * @route GET /api/reports/users-stats/excel
 * @access Private (Admin/Staff)
 */
exports.exportUserStatsExcel = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const worksheet = XLSX.utils.json_to_sheet(stats);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UserStats");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.attachment("user-stats.xlsx");
    return res.send(buffer);
  } catch (error) {
    logger.error("Export user stats Excel error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export user stats Excel",
    });
  }
};
