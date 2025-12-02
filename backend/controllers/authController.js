/**
 * ================================================================
 * 🔐 AUTHENTICATION CONTROLLER
 * ================================================================
 */

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const User = require("../models/UserModel");
const {
  generateTokenPair,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  extractToken,
} = require("../utils/jwtUtils");
const logger = require("../utils/logger");
const {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("../utils/emailService");

// ============================================================================
// UTILITY HELPERS
// ============================================================================

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const formatUserResponse = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };

  const sensitiveFields = [
    "password",
    "refreshToken",
    "__v",
    "loginAttempts",
    "lockUntil",
    "resetPasswordToken",
    "resetPasswordExpire",
    "emailVerificationToken",
    "emailVerificationExpire",
    "googleId",
  ];

  sensitiveFields.forEach((field) => delete obj[field]);
  return obj;
};

const logAuditEvent = async (eventData) => {
  try {
    logger.info(`🔐 AUDIT: ${JSON.stringify(eventData)}`);
  } catch (error) {
    logger.error(`❌ Audit log error: ${error.message}`);
  }
};

const sendAuthResponse = async (user, statusCode, res, message) => {
  try {
    const { accessToken, refreshToken } = generateTokenPair(user);

    if (typeof user.resetLoginAttempts === "function") {
      await user.resetLoginAttempts();
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(statusCode).json({
      success: true,
      message,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture || user.avatarUrl || user.image,
        coverImage: user.coverImage?.url || null,
        coverId: user.coverId || null,
        title: user.title,
        department: user.department,
        location: user.location,
        bio: user.bio,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error(`❌ Auth response error: ${error.message}`);
    throw error;
  }
};

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User with this email already exists",
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: password.trim(),
    phone: phone?.trim(),
    role: "user",
  });

  logger.info(`✅ New user registered: ${user.email} (ID: ${user._id})`);

  await logAuditEvent({
    action: "USER_REGISTERED",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendAuthResponse(user, 201, res, "Registration successful");
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  }).select("+password +loginAttempts +lockUntil");

  if (!user) {
    logger.warn(`⚠️ Login attempt with non-existent email: ${normalizedEmail}`);
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    logger.warn(`🔒 Login attempt on locked account: ${user.email}`);
    return res.status(423).json({
      success: false,
      message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      lockedUntil: user.lockUntil,
    });
  }

  if (!user.isActive) {
    logger.warn(`⚠️ Login attempt on deactivated account: ${user.email}`);
    return res.status(403).json({
      success: false,
      message: "Account is deactivated. Please contact support.",
    });
  }

  const isPasswordCorrect = await user.comparePassword(password.trim());
  if (!isPasswordCorrect) {
    await user.incrementLoginAttempts();
    logger.warn(`❌ Failed login attempt for user: ${user.email}`);
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  logger.info(`✅ Successful login: ${user.email} (ID: ${user._id})`);

  await logAuditEvent({
    action: "USER_LOGIN",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendAuthResponse(user, 200, res, "Login successful");
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = extractToken(req, true);

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
      code: "REFRESH_TOKEN_MISSING",
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findOne({
      _id: decoded.id,
      isDeleted: { $ne: true },
      isActive: true,
    });

    if (!user) {
      logger.warn(
        `⚠️ Refresh token used for deleted/inactive user: ${decoded.id}`
      );
      return res.status(404).json({
        success: false,
        message: "User not found or inactive",
        code: "USER_NOT_FOUND",
      });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokenPair(user);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setAuthCookies(res, accessToken, newRefresh);

    logger.info(`🔄 Token refreshed for user: ${user.email}`);

    await logAuditEvent({
      action: "TOKEN_REFRESHED",
      userId: user._id,
      email: user.email,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefresh,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`❌ Token refresh error: ${error.message}`);
    clearAuthCookies(res);
    return res.status(error.status || 401).json({
      success: false,
      message: error.message || "Invalid or expired refresh token",
      code: error.code || "REFRESH_TOKEN_INVALID",
    });
  }
});

exports.googleAuth = asyncHandler(async (req, res) => {
  const { email, name, picture, googleId } = req.body;

  if (!email || !name || !googleId) {
    logger.warn("⚠️ Google auth missing required data");
    return res.status(400).json({
      success: false,
      message: "Missing required Google authentication info",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  let isNewUser = false;

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.profilePicture = picture || user.profilePicture;
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
      logger.info(`🔗 Linked Google account to existing user: ${user.email}`);
    } else {
      logger.info(`✅ Existing Google user logged in: ${user.email}`);
    }
  } else {
    isNewUser = true;
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      googleId,
      profilePicture: picture,
      role: "user",
      isEmailVerified: true,
      password: crypto.randomBytes(32).toString("hex"),
    });
    logger.info(
      `✅ New user registered via Google: ${user.email} (ID: ${user._id})`
    );
  }

  await logAuditEvent({
    action: "GOOGLE_AUTH",
    userId: user._id,
    email: user.email,
    method: isNewUser ? "REGISTER" : "LOGIN",
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendAuthResponse(
    user,
    200,
    res,
    isNewUser
      ? "Account created successfully with Google"
      : "Google authentication successful"
  );
});

exports.logout = asyncHandler(async (req, res) => {
  if (req.user) {
    logger.info(`👋 User logged out: ${req.user.email} (ID: ${req.user._id})`);
    await logAuditEvent({
      action: "USER_LOGOUT",
      userId: req.user._id,
      email: req.user.email,
      timestamp: new Date(),
    });
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

exports.getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const user = formatUserResponse(req.user);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, title, department, location, bio, coverId } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (title !== undefined) updateData.title = title?.trim();
  if (department !== undefined) updateData.department = department?.trim();
  if (location !== undefined) updateData.location = location?.trim();
  if (bio !== undefined) updateData.bio = bio?.trim();
  if (coverId !== undefined) updateData.coverId = coverId;

  if (!Object.keys(updateData).length) {
    return res.status(400).json({
      success: false,
      message: "No fields to update",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  logger.info(`✏️ Profile updated: ${user.email}`);

  await logAuditEvent({
    action: "PROFILE_UPDATED",
    userId: user._id,
    changes: Object.keys(updateData),
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: formatUserResponse(user),
  });
});

exports.updateProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image file",
      code: "NO_FILE_UPLOADED",
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (user.profilePicture) {
    const oldPath = path.join(
      __dirname,
      "..",
      "uploads",
      "profile-pictures",
      path.basename(user.profilePicture)
    );
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
  await user.save();

  logger.info(`📸 Profile picture updated for user ${userId}`);

  res.json({
    success: true,
    message: "Profile picture updated successfully",
    data: formatUserResponse(user),
  });
});

exports.deleteProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (user.profilePicture) {
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "profile-pictures",
      path.basename(user.profilePicture)
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  user.profilePicture = null;
  await user.save();

  logger.info(`🗑️ Profile picture deleted for user ${userId}`);

  res.json({
    success: true,
    message: "Profile picture deleted successfully",
    data: formatUserResponse(user),
  });
});

exports.updateCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image file",
      code: "NO_FILE_UPLOADED",
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (user.coverImage) {
    const oldPath = path.join(
      __dirname,
      "..",
      "uploads",
      "cover-images",
      path.basename(user.coverImage)
    );
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  user.coverImage = `/uploads/cover-images/${req.file.filename}`;
  await user.save();

  logger.info(`🖼️ Cover image updated for user ${userId}`);

  res.json({
    success: true,
    message: "Cover image updated successfully",
    data: formatUserResponse(user),
  });
});

exports.deleteCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  if (user.coverImage) {
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "cover-images",
      path.basename(user.coverImage)
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  user.coverImage = null;
  await user.save();

  logger.info(`🗑️ Cover image deleted for user ${userId}`);

  res.json({
    success: true,
    message: "Cover image deleted successfully",
    data: formatUserResponse(user),
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (newPassword.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isCurrentPasswordCorrect = await user.comparePassword(
    currentPassword.trim()
  );

  if (!isCurrentPasswordCorrect) {
    logger.warn(`⚠️ Failed password change attempt: ${user.email}`);
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  user.password = newPassword.trim();
  await user.save();

  logger.info(`🔐 Password changed: ${user.email} (ID: ${user._id})`);

  await logAuditEvent({
    action: "PASSWORD_CHANGED",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
  });

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Password changed successfully. Please log in again.",
  });
});

// ============================================================================
// PASSWORD RESET
// ============================================================================

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

  if (!user) {
    logger.warn(
      `⚠️ Password reset requested for non-existent email: ${normalizedEmail}`
    );
    return res.status(200).json({
      success: true,
      message: "If an account exists, a reset link has been sent",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);

    logger.info(`📧 Password reset email sent to: ${user.email}`);

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

    logger.error(`❌ Forgot password email error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to send reset email. Please try again later.",
    });
  }
});

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
    logger.warn("⚠️ Invalid or expired reset token used");
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
    logger.error(
      `❌ Password reset confirmation email error: ${error.message}`
    );
  }

  logger.info(`✅ Password reset successful for: ${user.email}`);

  await logAuditEvent({
    action: "PASSWORD_RESET",
    userId: user._id,
    email: user.email,
    timestamp: new Date(),
    ip: req.ip,
  });

  return res.status(200).json({
    success: true,
    message: "Password has been reset successfully. You can now log in.",
  });
});

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { isDeleted: { $ne: true } };

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  if (req.query.role && ["user", "staff", "admin"].includes(req.query.role)) {
    filter.role = req.query.role;
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const sortField = req.query.sort || "createdAt";
  const sortOrder = req.query.order === "asc" ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean(),
    User.countDocuments(filter),
  ]);

  logger.info(
    `📋 User list retrieved: ${users.length} users (Page ${page}) by ${req.user.email}`
  );

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = formatUserResponse(req.targetUser);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, role, isActive, coverId } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (coverId !== undefined) updateData.coverId = coverId;
  updateData.updatedAt = Date.now();

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(
    `✏️ User updated: ${user.email} by ${req.user.email} (Admin ID: ${req.user._id})`
  );

  await logAuditEvent({
    action: "USER_UPDATED",
    performedBy: req.user._id,
    targetUser: user._id,
    changes: updateData,
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: formatUserResponse(user),
  });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role, reason } = req.body;

  if (!["user", "staff", "admin"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Must be: user, staff, or admin",
    });
  }

  if (req.user.id === req.params.id) {
    return res.status(403).json({
      success: false,
      message: "Cannot change your own role",
    });
  }

  const oldRole = req.targetUser.role;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      role,
      roleChangedAt: Date.now(),
      roleChangedBy: req.user.id,
      roleChangeReason: reason || "No reason provided",
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(
    `🔄 User role updated: ${user.email} from ${oldRole} to ${role} by ${req.user.email}`
  );

  await logAuditEvent({
    action: "ROLE_CHANGED",
    performedBy: req.user._id,
    targetUser: req.params.id,
    oldRole,
    newRole: role,
    reason,
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: formatUserResponse(user),
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(403).json({
      success: false,
      message: "Cannot delete your own account",
    });
  }

  const user = await User.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: Date.now(),
    deletedBy: req.user.id,
    isActive: false,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info(
    `🗑️ User soft deleted: ${req.targetUser.email} by ${req.user.email}`
  );

  await logAuditEvent({
    action: "USER_DELETED",
    performedBy: req.user._id,
    targetUser: req.params.id,
    targetEmail: req.targetUser.email,
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

exports.bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of user IDs",
    });
  }

  if (userIds.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: "Cannot delete your own account",
    });
  }

  const result = await User.updateMany(
    { _id: { $in: userIds }, isDeleted: { $ne: true } },
    {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: req.user.id,
      isActive: false,
    }
  );

  logger.info(
    `🗑️ Bulk delete: ${result.modifiedCount}/${userIds.length} users deleted by ${req.user.email}`
  );

  await logAuditEvent({
    action: "BULK_USER_DELETE",
    performedBy: req.user._id,
    targetUserIds: userIds,
    requestedCount: userIds.length,
    deletedCount: result.modifiedCount,
    timestamp: new Date(),
  });

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} user(s) deleted successfully`,
    data: {
      requestedCount: userIds.length,
      deletedCount: result.modifiedCount,
    },
  });
});

exports.getTeamMembers = asyncHandler(async (req, res) => {
  const team = await User.find({
    isDeleted: { $ne: true },
    isActive: true,
  })
    .select("name email profilePicture role title")
    .limit(20)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: team.length,
    data: team,
  });
});

exports.updateAvatar = exports.updateProfilePicture;
