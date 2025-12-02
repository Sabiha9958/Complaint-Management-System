/**
 * ════════════════════════════════════════════════════════════════
 * 👤 USER CONTROLLER
 * ════════════════════════════════════════════════════════════════
 * Handles user profile management, avatar uploads, updates,
 * statistics, and password reset (forgot/reset).
 * ════════════════════════════════════════════════════════════════
 */

const fs = require("fs");
const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");

const User = require("../models/UserModel");
const logger = require("../utils/logger");
const {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("../utils/emailService");

// ════════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Async error wrapper (like in authController)
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Standardized server error response + logging
 */
const sendServerError = (res, message, error) => {
  if (error) {
    logger.error(message, { error });
  } else {
    logger.error(message);
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message,
  });
};

/**
 * Standard error response
 */
const sendErrorResponse = (res, statusCode, message, extra = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...extra,
  });
};

/**
 * Clean up uploaded file on error
 */
const cleanupFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to cleanup file: ${filePath}`, { error });
  }
};

/**
 * Simple MongoDB ObjectId validator (24 hex chars)
 */
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Lightweight audit logger (similar to authController)
 */
const logAuditEvent = async (eventData) => {
  try {
    logger.info(`AUDIT: ${JSON.stringify(eventData)}`);
    // Optionally persist audit events to DB
  } catch (error) {
    logger.error(`Audit log error: ${error.message}`, { error });
  }
};

// ════════════════════════════════════════════════════════════════
// 📋 USER MANAGEMENT (ADMIN/STAFF)
// ════════════════════════════════════════════════════════════════

/**
 * Get all users with pagination and filtering
 * @route   GET /api/users
 * @access  Private (Admin/Staff)
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      sortBy = "-createdAt",
      isActive,
    } = req.query;

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (numericPage - 1) * numericLimit;

    const query = {};

    if (role && ["user", "staff", "admin"].includes(role)) {
      query.role = role;
    }

    if (typeof isActive === "string") {
      query.isActive = isActive === "true";
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { department: regex },
        { title: regex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "-password -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil"
        )
        .sort(sortBy)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      count: users.length,
      total,
      page: numericPage,
      pages: Math.ceil(total / numericLimit),
      data: users,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch users.", error);
  }
};

/**
 * Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin/Staff)
 */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Invalid user ID format."
      );
    }

    const user = await User.findById(id).select(
      "-password -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil"
    );

    if (!user) {
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch user.", error);
  }
};

/**
 * Update user by ID (Admin/Staff)
 * @route   PUT /api/users/:id
 * @access  Private (Admin/Staff)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Invalid user ID format."
      );
    }

    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;
    delete updates.email;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    logger.info(`User ${user._id} updated by ${req.user.email}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User updated successfully.",
      data: user,
    });
  } catch (error) {
    return sendServerError(res, "Failed to update user.", error);
  }
};

/**
 * Delete user by ID
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Invalid user ID format."
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    if (user._id.toString() === req.user._id.toString()) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "You cannot delete your own account."
      );
    }

    if (user.role === "admin" && req.user.role !== "super_admin") {
      return sendErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        "You cannot delete admin accounts."
      );
    }

    await user.deleteOne();

    logger.info(
      `User ${user._id} (${user.email}) deleted by ${req.user.email}`
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return sendServerError(res, "Failed to delete user.", error);
  }
};

// ════════════════════════════════════════════════════════════════
// 👤 PROFILE MANAGEMENT (CURRENT USER)
// ════════════════════════════════════════════════════════════════

/**
 * Get own profile
 * @route   GET /api/users/me
 * @access  Private (User)
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil"
    );

    if (!user) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Profile not found."
      );
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch profile.", error);
  }
};

/**
 * Update own profile (text fields only)
 * @route   PUT /api/users/me
 * @access  Private (User)
 */
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "phone",
      "title",
      "department",
      "location",
      "bio",
    ];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    delete updates.role;
    delete updates.email;
    delete updates.password;
    delete updates.isActive;
    delete updates.isEmailVerified;

    if (Object.keys(updates).length === 0) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "No valid fields to update."
      );
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        "Profile not found."
      );
    }

    logger.info(`Profile updated by ${req.user.email}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully.",
      data: user,
    });
  } catch (error) {
    return sendServerError(res, "Failed to update profile.", error);
  }
};

// ════════════════════════════════════════════════════════════════
// 📸 AVATAR MANAGEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Upload/Update Avatar
 * @route   POST /api/users/me/avatar
 * @access  Private (User)
 */
const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Please upload an image file."
      );
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      cleanupFile(req.file.path);
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    const avatar = await user.updateAvatar(req.file, req);

    logger.info(
      `Avatar updated by ${req.user.email} - File: ${req.file.filename}`
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Avatar uploaded successfully.",
      data: {
        avatar,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    cleanupFile(req.file?.path);
    return sendServerError(res, "Failed to upload avatar.", error);
  }
};

/**
 * Delete Avatar
 * @route   DELETE /api/users/me/avatar
 * @access  Private (User)
 */
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    if (!user.avatar && !user.image) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "No avatar to delete."
      );
    }

    await user.deleteAvatar();

    logger.info(`Avatar deleted by ${req.user.email} (ID: ${req.user._id})`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Avatar deleted successfully.",
      data: user.toSafeObject(),
    });
  } catch (error) {
    logger.error("Delete avatar error:", { error });
    return sendServerError(res, "Failed to delete avatar.", error);
  }
};

// ════════════════════════════════════════════════════════════════
// 🖼️ COVER IMAGE MANAGEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Upload/Update Cover Image
 * @route   POST /api/users/me/cover
 * @access  Private (User)
 */
const uploadCoverImageController = async (req, res) => {
  try {
    if (!req.file) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Please upload an image file."
      );
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      cleanupFile(req.file.path);
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    if (user.coverImage?.path) {
      cleanupFile(user.coverImage.path);
    }

    user.coverImage = {
      filename: req.file.filename,
      url: `${req.protocol}://${req.get("host")}/uploads/covers/${
        req.file.filename
      }`,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    await user.save({ validateBeforeSave: false });

    logger.info(
      `Cover image updated by ${req.user.email} - File: ${req.file.filename}`
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Cover image uploaded successfully.",
      data: {
        coverImage: user.coverImage,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    cleanupFile(req.file?.path);
    return sendServerError(res, "Failed to upload cover image.", error);
  }
};

// ════════════════════════════════════════════════════════════════
// 📝 COMBINED PROFILE UPDATE
// ════════════════════════════════════════════════════════════════

/**
 * Update profile with avatar (multipart form data)
 * @route   PUT /api/users/me/profile
 * @access  Private (User)
 */
const updateProfileWithAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      cleanupFile(req.file?.path);
      return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found.");
    }

    const allowedUpdates = [
      "name",
      "phone",
      "title",
      "department",
      "location",
      "bio",
    ];
    let hasUpdates = false;

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
        hasUpdates = true;
      }
    });

    if (req.file) {
      await user.updateAvatar(req.file, req);
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "No fields to update."
      );
    }

    await user.save({ validateBeforeSave: false });

    logger.info(`Profile (with avatar) updated by ${req.user.email}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully.",
      data: user.toSafeObject(),
    });
  } catch (error) {
    cleanupFile(req.file?.path);
    return sendServerError(res, "Failed to update profile with avatar.", error);
  }
};

// ════════════════════════════════════════════════════════════════
// 📊 STATISTICS & ANALYTICS
// ════════════════════════════════════════════════════════════════

/**
 * Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (Admin/Staff)
 */
const getUserStats = async (req, res) => {
  try {
    const [roleStats, activeUsers, inactiveUsers, verifiedUsers, totalUsers] =
      await Promise.all([
        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 },
            },
          },
        ]),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments(),
      ]);

    const result = {
      total: totalUsers,
      byRole: {
        admin: 0,
        staff: 0,
        user: 0,
      },
      byStatus: {
        active: activeUsers,
        inactive: inactiveUsers,
      },
      verification: {
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
      },
    };

    roleStats.forEach((stat) => {
      if (stat._id) {
        result.byRole[stat._id] = stat.count;
      }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch user statistics.", error);
  }
};

/**
 * Bulk user action
 * @route   POST /api/users/bulk
 * @access  Private (Admin/Staff)
 */
const bulkUserAction = async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Action and userIds array are required."
      );
    }

    const invalidIds = userIds.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Invalid user IDs provided.",
        { invalidIds }
      );
    }

    let updateData = {};

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        break;
      case "deactivate":
        updateData = { isActive: false };
        break;
      case "verify":
        updateData = { isEmailVerified: true };
        break;
      default:
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Invalid action. Use: activate, deactivate, or verify."
        );
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updateData }
    );

    logger.info(
      `Bulk user action '${action}' performed by ${req.user.email} on ${result.modifiedCount} users`
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Bulk action '${action}' applied successfully.`,
      data: {
        requested: userIds.length,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (error) {
    return sendServerError(res, "Failed to perform bulk user action.", error);
  }
};

// ════════════════════════════════════════════════════════════════
// 🔑 PASSWORD RESET (FORGOT / RESET)
// ════════════════════════════════════════════════════════════════

/**
 * Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendErrorResponse(
      res,
      StatusCodes.BAD_REQUEST,
      "Please provide an email address"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  // Do not reveal whether user exists
  if (!user) {
    logger.warn(
      `Password reset requested for non-existent email: ${normalizedEmail}`
    );
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "If an account exists, a password reset email has been sent",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);

    logger.info(`Password reset email sent to: ${user.email}`);

    await logAuditEvent({
      action: "FORGOT_PASSWORD_REQUEST",
      userId: user._id,
      email: user.email,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error(`Forgot password email error: ${error.message}`, { error });

    return sendServerError(
      res,
      "Failed to send reset email. Please try again later.",
      error
    );
  }
});

/**
 * Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return sendErrorResponse(
      res,
      StatusCodes.BAD_REQUEST,
      "Token and new password are required"
    );
  }

  if (password.trim().length < 6) {
    return sendErrorResponse(
      res,
      StatusCodes.BAD_REQUEST,
      "Password must be at least 6 characters"
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
    isDeleted: { $ne: true },
  }).select("+password");

  if (!user) {
    logger.warn("Invalid or expired reset token used");
    return sendErrorResponse(
      res,
      StatusCodes.BAD_REQUEST,
      "Invalid or expired reset token"
    );
  }

  user.password = password.trim();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  try {
    await sendPasswordResetConfirmation(user);
  } catch (error) {
    logger.error(`Password reset confirmation email error: ${error.message}`, {
      error,
    });
  }

  logger.info(`Password reset successful for: ${user.email}`);

  await logAuditEvent({
    action: "PASSWORD_RESET",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Password has been reset successfully",
  });
});

/**
 * Forgot password - send reset email
 * Route: POST /api/auth/forgot-password
 * Access: Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please provide an email address",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  // Do not reveal whether user exists (for security)
  if (!user) {
    logger.warn(
      `Password reset requested for non-existent email: ${normalizedEmail}`
    );
    return res.status(200).json({
      success: true,
      message: "If an account exists, a password reset email has been sent",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);

    logger.info(`Password reset email sent to: ${user.email}`);

    await logAuditEvent({
      action: "FORGOT_PASSWORD_REQUEST",
      userId: user._id,
      email: user.email,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    logger.error(`Forgot password email error: ${error.message}`, { error });

    return res.status(500).json({
      success: false,
      message: "Failed to send reset email. Please try again later.",
    });
  }
});

/**
 * Reset password using token
 * Route: POST /api/auth/reset-password
 * Access: Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Token and new password are required",
    });
  }

  if (password.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
    isDeleted: { $ne: true },
  }).select("+password");

  if (!user) {
    logger.warn("Invalid or expired reset token used");
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  user.password = password.trim();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  try {
    await sendPasswordResetConfirmation(user);
  } catch (error) {
    logger.error(`Password reset confirmation email error: ${error.message}`, {
      error,
    });
  }

  logger.info(`Password reset successful for: ${user.email}`);

  await logAuditEvent({
    action: "PASSWORD_RESET",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: "Password has been reset successfully",
  });
});

// ════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ════════════════════════════════════════════════════════════════

module.exports = {
  // User Management
  getUsers,
  getUser,
  updateUser,
  deleteUser,

  // Profile Management
  getProfile,
  updateProfile,
  updateProfileWithAvatar,

  // Avatar Management
  uploadAvatarController,
  deleteAvatar,

  // Cover Image Management
  uploadCoverImageController,

  // Statistics & Bulk Actions
  getUserStats,
  bulkUserAction,

  // Password Reset
  forgotPassword,
  resetPassword,
};
