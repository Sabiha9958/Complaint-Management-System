/**
 * ════════════════════════════════════════════════════════════════
 * 🔐 AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ════════════════════════════════════════════════════════════════
 * JWT-based authentication with role-based access control (RBAC)
 * Supports access/refresh tokens, email verification, and ownership checks
 */

const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const { verifyAccessToken, extractToken } = require("../utils/jwtUtils");
const logger = require("../utils/logger");

/**
 * Core authentication middleware - Protects routes requiring authentication
 * Verifies JWT token and attaches authenticated user to request object
 *
 * @route Any protected route
 * @access Private
 */
const protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractToken(req, false);

    if (!token) {
      logger.warn(
        `⚠️ Unauthorized access attempt - No token provided from ${req.ip}`
      );
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authentication required. Please provide a valid token.",
        code: "TOKEN_MISSING",
        timestamp: new Date().toISOString(),
      });
    }

    // Verify and decode JWT token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
      logger.debug?.(`✅ Token verified for user ID: ${decoded.id}`);
    } catch (error) {
      logger.warn(`⚠️ Token verification failed: ${error.message}`);

      // Handle specific JWT errors
      const errorResponses = {
        TokenExpiredError: {
          message: "Token has expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        },
        JsonWebTokenError: {
          message: "Invalid token. Authorization denied.",
          code: "TOKEN_INVALID",
        },
        NotBeforeError: {
          message: "Token not yet valid.",
          code: "TOKEN_NOT_ACTIVE",
        },
      };

      const errorResponse = errorResponses[error.name] || {
        message: "Token verification failed.",
        code: "TOKEN_VERIFICATION_FAILED",
      };

      return res.status(401).json({
        success: false,
        statusCode: 401,
        ...errorResponse,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch user from database
    const currentUser = await User.findById(decoded.id).select(
      "-password -refreshToken -__v -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire"
    );

    if (!currentUser) {
      logger.warn(`⚠️ Token valid but user not found: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "User associated with this token no longer exists.",
        code: "USER_NOT_FOUND",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if account is deleted
    if (currentUser.isDeleted) {
      logger.warn(`⚠️ Deleted user attempted access: ${currentUser.email}`);
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message:
          "This account has been permanently deleted. Please contact support for assistance.",
        code: "ACCOUNT_DELETED",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if account is active
    if (!currentUser.isActive) {
      logger.warn(`⚠️ Inactive user attempted access: ${currentUser.email}`);
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message:
          "Your account is currently deactivated. Please contact support to reactivate.",
        code: "ACCOUNT_INACTIVE",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if password was changed after token was issued
    if (
      typeof currentUser.changedPasswordAfter === "function" &&
      currentUser.changedPasswordAfter(decoded.iat)
    ) {
      logger.warn(
        `⚠️ Token issued before password change: ${currentUser.email}`
      );
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message:
          "Password was recently changed. Please log in again with your new password.",
        code: "PASSWORD_CHANGED",
        timestamp: new Date().toISOString(),
      });
    }

    // Attach user to request object for downstream middleware/controllers
    req.user = currentUser;
    logger.debug?.(
      `✅ User authenticated: ${currentUser.email} (${currentUser.role})`
    );

    next();
  } catch (error) {
    logger.error(`❌ Auth middleware error: ${error.message}`, {
      stack: error.stack,
      ip: req.ip,
    });

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "An authentication error occurred. Please try again.",
      code: "AUTH_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Role-based authorization middleware
 * Restricts access to specific user roles (admin, moderator, user, etc.)
 *
 * @param {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/admin/users', protect, authorize('admin'), getUsers);
 * router.post('/complaints', protect, authorize('admin', 'user'), createComplaint);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      logger.warn("⚠️ Authorization check failed - User not authenticated");
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authentication required. Please log in first.",
        code: "NOT_AUTHENTICATED",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `⚠️ Unauthorized access attempt by ${req.user.email} (Role: ${
          req.user.role
        }) - Required: ${allowedRoles.join(", ")}`
      );

      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Access denied. This resource requires one of the following roles: ${allowedRoles.join(
          ", "
        )}.`,
        code: "INSUFFICIENT_PERMISSIONS",
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        },
        timestamp: new Date().toISOString(),
      });
    }

    logger.debug?.(
      `✅ User authorized: ${req.user.email} with role ${req.user.role}`
    );
    next();
  };
};

/**
 * Alias for admin-only authorization
 * Convenience method for routes that require admin access
 */
const adminOnly = authorize("admin");

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block request if token is missing/invalid
 * Useful for routes that behave differently for authenticated vs anonymous users
 *
 * @example
 * router.get('/complaints', optionalAuth, getComplaints); // Shows more data if authenticated
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req, false);

    // No token provided - continue as anonymous user
    if (!token) {
      logger.debug?.(
        "Optional auth: No token provided, continuing as anonymous"
      );
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);

      const currentUser = await User.findById(decoded.id).select(
        "-password -refreshToken -__v"
      );

      // Only attach user if account is valid and active
      if (
        currentUser &&
        !currentUser.isDeleted &&
        currentUser.isActive &&
        (!currentUser.changedPasswordAfter ||
          !currentUser.changedPasswordAfter(decoded.iat))
      ) {
        req.user = currentUser;
        logger.debug?.(
          `✅ Optional auth: User authenticated - ${currentUser.email}`
        );
      } else {
        logger.debug?.(
          "Optional auth: User not valid, continuing as anonymous"
        );
      }
    } catch (error) {
      logger.debug?.(
        `Optional auth: Token invalid - ${error.message}, continuing as anonymous`
      );
    }

    next();
  } catch (error) {
    logger.error(`❌ Optional auth error: ${error.message}`);
    // Don't block request on error
    next();
  }
};

/**
 * Resource ownership or admin access middleware
 * Allows access if user is resource owner OR has admin role
 *
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware function
 *
 * @example
 * router.put('/complaints/:id',
 *   protect,
 *   checkOwnershipOrAdmin((req) => req.complaint.user.toString()),
 *   updateComplaint
 * );
 */
const checkOwnershipOrAdmin = (getResourceOwnerId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authentication required.",
        code: "NOT_AUTHENTICATED",
        timestamp: new Date().toISOString(),
      });
    }

    // Admin has access to everything
    if (req.user.role === "admin") {
      logger.debug?.(`✅ Admin access granted: ${req.user.email}`);
      return next();
    }

    // Extract resource owner ID
    const ownerId = getResourceOwnerId(req);

    if (!ownerId) {
      logger.error("❌ Resource owner ID could not be determined");
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Unable to verify resource ownership.",
        code: "OWNERSHIP_CHECK_FAILED",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user owns the resource
    if (req.user.id !== ownerId.toString()) {
      logger.warn(
        `⚠️ Unauthorized ownership access by ${req.user.email} - Resource owner: ${ownerId}`
      );

      return res.status(403).json({
        success: false,
        statusCode: 403,
        message:
          "Access denied. You do not have permission to access this resource.",
        code: "NOT_RESOURCE_OWNER",
        timestamp: new Date().toISOString(),
      });
    }

    logger.debug?.(`✅ Resource owner verified: ${req.user.email}`);
    next();
  };
};

/**
 * Email verification requirement middleware
 * Blocks access if user's email is not verified
 *
 * @example
 * router.post('/complaints', protect, requireEmailVerified, createComplaint);
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Authentication required.",
      code: "NOT_AUTHENTICATED",
      timestamp: new Date().toISOString(),
    });
  }

  if (!req.user.isEmailVerified) {
    logger.warn(`⚠️ Unverified email access attempt: ${req.user.email}`);
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message:
        "Email verification required to access this resource. Please check your email for the verification link.",
      code: "EMAIL_NOT_VERIFIED",
      details: {
        email: req.user.email,
        resendVerificationUrl: "/api/auth/resend-verification",
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * Attach target user middleware
 * Loads another user's data based on route parameter
 * Useful for admin operations on specific users
 *
 * @example
 * router.get('/admin/users/:userId', protect, adminOnly, attachTargetUser, getUserDetails);
 */
const attachTargetUser = async (req, res, next) => {
  try {
    const userId = req.params.id || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "User ID parameter is required.",
        code: "USER_ID_REQUIRED",
        timestamp: new Date().toISOString(),
      });
    }

    // Validate MongoDB ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Invalid user ID format.",
        code: "INVALID_USER_ID",
        timestamp: new Date().toISOString(),
      });
    }

    const targetUser = await User.findById(userId).select(
      "-password -refreshToken"
    );

    if (!targetUser || targetUser.isDeleted) {
      logger.warn(`⚠️ Target user not found: ${userId}`);
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found or has been deleted.",
        code: "USER_NOT_FOUND",
        timestamp: new Date().toISOString(),
      });
    }

    req.targetUser = targetUser;
    logger.debug?.(`✅ Target user attached: ${targetUser.email}`);
    next();
  } catch (error) {
    logger.error(`❌ Error attaching target user: ${error.message}`);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Error loading user data. Please try again.",
      code: "TARGET_USER_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Rate limit bypass for trusted sources
 * Checks if request comes from trusted IP or has special bypass token
 *
 * @example
 * router.post('/bulk-import', protect, adminOnly, trustedSourceBypass, bulkImport);
 */
const trustedSourceBypass = (req, res, next) => {
  const trustedIPs = (process.env.TRUSTED_IPS || "").split(",").filter(Boolean);
  const bypassToken = req.headers["x-bypass-token"];

  if (
    trustedIPs.includes(req.ip) ||
    bypassToken === process.env.RATE_LIMIT_BYPASS_TOKEN
  ) {
    req.rateLimitBypass = true;
    logger.info(`✅ Rate limit bypass granted for IP: ${req.ip}`);
  }

  next();
};

/**
 * Account status validation middleware
 * Comprehensive check for account health
 */
const validateAccountStatus = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
      code: "NOT_AUTHENTICATED",
    });
  }

  const issues = [];

  if (req.user.isDeleted) issues.push("Account is deleted");
  if (!req.user.isActive) issues.push("Account is inactive");
  if (!req.user.isEmailVerified) issues.push("Email not verified");
  if (req.user.isSuspended) issues.push("Account is suspended");

  if (issues.length > 0) {
    logger.warn(
      `⚠️ Account status issues for ${req.user.email}: ${issues.join(", ")}`
    );
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "Account access restricted.",
      code: "ACCOUNT_RESTRICTED",
      details: { issues },
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  adminOnly,
  optionalAuth,
  checkOwnershipOrAdmin,
  requireEmailVerified,
  attachTargetUser,
  trustedSourceBypass,
  validateAccountStatus,
};
