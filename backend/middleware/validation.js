/**
 * ================================================================
 * 🛡️ VALIDATION MIDDLEWARE
 * ================================================================
 * Comprehensive request validation using express-validator
 * Implements security best practices for input validation and sanitization
 *
 * @module middleware/validation
 * @requires express-validator
 * ================================================================
 */

const { body, param, query, validationResult } = require("express-validator");
const User = require("../models/UserModel");
const Complaint = require("../models/Complaint");
const logger = require("../utils/logger");

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

/**
 * Central validation error handler
 * Formats and returns validation errors consistently
 * @middleware
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value !== undefined ? err.value : null,
      location: err.location,
    }));

    logger.warn(`⚠️ Validation failed for ${req.method} ${req.path}`, {
      errors: formattedErrors,
      ip: req.ip,
      user: req.user?.email || "anonymous",
    });

    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: formattedErrors,
    });
  }

  next();
};

// ============================================================================
// CUSTOM VALIDATORS (Reusable async validators)
// ============================================================================

/**
 * Check if email is already registered
 */
const isEmailUnique = async (email) => {
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }
  return true;
};

/**
 * Check if email is available for update (excludes current user)
 */
const isEmailUniqueForUpdate = async (email, { req }) => {
  if (!email) return true; // Skip if not provided

  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    _id: { $ne: req.params.id },
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Email is already in use by another user");
  }
  return true;
};

/**
 * Check if phone number is already registered
 */
const isPhoneUnique = async (phone) => {
  if (!phone) return true; // Optional field

  const existingUser = await User.findOne({
    phone,
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Phone number is already registered");
  }
  return true;
};

/**
 * Check if phone is available for update (excludes current user)
 */
const isPhoneUniqueForUpdate = async (phone, { req }) => {
  if (!phone) return true; // Skip if not provided

  const existingUser = await User.findOne({
    phone,
    _id: { $ne: req.params.id },
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Phone number is already in use by another user");
  }
  return true;
};

/**
 * Verify user exists and is not deleted
 */
const doesUserExist = async (userId, { req }) => {
  const user = await User.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Attach to request for controller reuse
  req.targetUser = user;
  return true;
};

/**
 * Verify complaint exists and is not deleted
 */
const doesComplaintExist = async (complaintId, { req }) => {
  const complaint = await Complaint.findOne({
    _id: complaintId,
    isDeleted: { $ne: true },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // Attach to request for controller reuse
  req.targetComplaint = complaint;
  return true;
};

// ============================================================================
// AUTHENTICATION VALIDATIONS
// ============================================================================

/**
 * Validate user registration
 * @route POST /api/auth/register
 */
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .escape(),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase()
    .custom(isEmailUnique),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)"
    ),

  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),

  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone must be a valid 10-digit Indian mobile number")
    .custom(isPhoneUnique),

  handleValidation,
];

/**
 * Validate user login
 * @route POST /api/auth/login
 */
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidation,
];

/**
 * Validate password change
 * @route PUT /api/auth/change-password
 */
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, lowercase letter, number, and special character"
    )
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),

  handleValidation,
];

/**
 * Validate forgot password request
 * @route POST /api/auth/forgot-password
 */
const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),

  handleValidation,
];

/**
 * Validate password reset
 * @route POST /api/auth/reset-password
 */
const resetPasswordValidation = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isString()
    .withMessage("Invalid token format"),

  body("password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, lowercase letter, number, and special character"
    ),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),

  handleValidation,
];

// ============================================================================
// USER PROFILE VALIDATIONS
// ============================================================================

/**
 * Validate profile update
 * @route PUT /api/auth/me
 */
const profileUpdateValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .escape(),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage("Title cannot exceed 120 characters")
    .escape(),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department cannot exceed 100 characters")
    .escape(),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Location cannot exceed 200 characters")
    .escape(),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio cannot exceed 1000 characters")
    .escape(),

  handleValidation,
];

// ============================================================================
// ADMIN USER MANAGEMENT VALIDATIONS
// ============================================================================

/**
 * Validate user ID parameter
 */
const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID format")
    .custom(doesUserExist),

  handleValidation,
];

/**
 * Validate admin user update
 * @route PUT /api/auth/users/:id
 */
const userUpdateValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .escape(),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase()
    .custom(isEmailUniqueForUpdate),

  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone must be a valid 10-digit Indian mobile number")
    .custom(isPhoneUniqueForUpdate),

  body("role")
    .optional()
    .isIn(["user", "staff", "admin"])
    .withMessage("Role must be either user, staff, or admin"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value")
    .toBoolean(),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department cannot exceed 100 characters")
    .escape(),

  handleValidation,
];

/**
 * Validate role update with reason
 * @route PATCH /api/auth/users/:id/role
 */
const roleUpdateValidation = [
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["user", "staff", "admin"])
    .withMessage("Role must be either user, staff, or admin"),

  body("reason")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be between 10 and 500 characters if provided")
    .escape(),

  handleValidation,
];

/**
 * Validate bulk user deletion
 * @route POST /api/auth/users/bulk-delete
 */
const bulkDeleteValidation = [
  body("userIds")
    .isArray({ min: 1, max: 50 })
    .withMessage("userIds must be an array containing 1 to 50 user IDs"),

  body("userIds.*")
    .isMongoId()
    .withMessage("Each user ID must be a valid MongoDB ObjectId"),

  handleValidation,
];

// ============================================================================
// COMPLAINT VALIDATIONS
// ============================================================================

/**
 * Validate complaint creation
 * @route POST /api/complaints
 */
const complaintCreateValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters")
    .escape(),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters")
    .escape(),

  body("category")
    .optional()
    .isIn([
      "technical",
      "billing",
      "service",
      "product",
      "harassment",
      "safety",
      "other",
    ])
    .withMessage("Invalid category selected"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department cannot exceed 100 characters")
    .escape(),

  // Contact Info Validation
  body("contactInfo")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === "object" && parsed !== null;
        } catch {
          return false;
        }
      }
      return typeof value === "object" && value !== null;
    })
    .withMessage("Contact info must be a valid object"),

  body("contactInfo.name")
    .if(body("contactInfo").exists())
    .custom((value, { req }) => {
      const contactInfo =
        typeof req.body.contactInfo === "string"
          ? JSON.parse(req.body.contactInfo)
          : req.body.contactInfo;
      return contactInfo?.name && contactInfo.name.trim().length >= 2;
    })
    .withMessage("Contact name is required and must be at least 2 characters"),

  body("contactInfo.email")
    .if(body("contactInfo").exists())
    .custom((value, { req }) => {
      const contactInfo =
        typeof req.body.contactInfo === "string"
          ? JSON.parse(req.body.contactInfo)
          : req.body.contactInfo;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return contactInfo?.email && emailRegex.test(contactInfo.email);
    })
    .withMessage("Valid contact email is required"),

  body("contactInfo.phone")
    .optional()
    .custom((value, { req }) => {
      const contactInfo =
        typeof req.body.contactInfo === "string"
          ? JSON.parse(req.body.contactInfo)
          : req.body.contactInfo;
      if (!contactInfo?.phone) return true;
      return /^[6-9]\d{9}$/.test(contactInfo.phone);
    })
    .withMessage("Contact phone must be a valid 10-digit Indian mobile number"),

  handleValidation,
];

/**
 * Validate complaint ID parameter
 */
const complaintIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid complaint ID format")
    .custom(doesComplaintExist),

  handleValidation,
];

/**
 * Validate complaint update
 * @route PUT /api/complaints/:id
 */
const complaintUpdateValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters")
    .escape(),

  body("category")
    .optional()
    .isIn([
      "technical",
      "billing",
      "service",
      "product",
      "harassment",
      "safety",
      "other",
    ])
    .withMessage("Invalid category selected"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),

  body("status")
    .optional()
    .isIn(["pending", "in_progress", "resolved", "rejected", "closed"])
    .withMessage("Invalid status value"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters")
    .escape(),

  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Invalid assignedTo user ID"),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department cannot exceed 100 characters")
    .escape(),

  handleValidation,
];

/**
 * Validate complaint status update
 * @route PATCH /api/complaints/:id/status
 */
const complaintStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "in_progress", "resolved", "rejected", "closed"])
    .withMessage(
      "Status must be pending, in_progress, resolved, rejected, or closed"
    ),

  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Status note cannot exceed 500 characters")
    .escape(),

  handleValidation,
];

/**
 * Validate complaint assignment
 * @route PATCH /api/complaints/:id/assign
 */
const complaintAssignValidation = [
  body("assignedTo")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID format"),

  handleValidation,
];

/**
 * Validate complaint comment
 * @route POST /api/complaints/:id/comments
 */
const complaintCommentValidation = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment must be between 1 and 500 characters")
    .escape(),

  handleValidation,
];

// ============================================================================
// PAGINATION & QUERY VALIDATIONS
// ============================================================================

/**
 * Validate pagination and filtering query parameters
 */
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("sort")
    .optional()
    .isIn([
      "createdAt",
      "updatedAt",
      "name",
      "email",
      "priority",
      "status",
      "title",
    ])
    .withMessage("Invalid sort field"),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be 'asc' or 'desc'"),

  query("status")
    .optional()
    .isIn(["pending", "in_progress", "resolved", "rejected", "closed"])
    .withMessage("Invalid status filter"),

  query("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority filter"),

  query("category")
    .optional()
    .isIn([
      "technical",
      "billing",
      "service",
      "product",
      "harassment",
      "safety",
      "other",
    ])
    .withMessage("Invalid category filter"),

  query("role")
    .optional()
    .isIn(["user", "staff", "admin"])
    .withMessage("Invalid role filter"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false")
    .toBoolean(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term cannot exceed 100 characters")
    .escape(),

  handleValidation,
];

/**
 * Generic MongoDB ID validator
 */
const mongoIdValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),

  handleValidation,
];

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core handler
  handleValidation,

  // Authentication
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,

  // User Profile
  profileUpdateValidation,

  // Admin User Management
  userIdValidation,
  userUpdateValidation,
  roleUpdateValidation,
  bulkDeleteValidation,

  // Complaints
  complaintCreateValidation,
  complaintIdValidation,
  complaintUpdateValidation,
  complaintStatusValidation,
  complaintAssignValidation,
  complaintCommentValidation,

  // Utility
  paginationValidation,
  mongoIdValidation,

  // Custom validators (for external use if needed)
  customValidators: {
    isEmailUnique,
    isEmailUniqueForUpdate,
    isPhoneUnique,
    isPhoneUniqueForUpdate,
    doesUserExist,
    doesComplaintExist,
  },
};
