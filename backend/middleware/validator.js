/**
 * ================================================================
 * 🛡️ VALIDATION MIDDLEWARE
 * ================================================================
 */

const { body, query, param, validationResult } = require("express-validator");
const User = require("../models/UserModel");
const Complaint = require("../models/Complaint");
const logger = require("../utils/logger");

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value !== undefined ? err.value : null,
      location: err.location,
    }));

    logger.warn(`Validation failed for ${req.method} ${req.path}`, {
      errors: formattedErrors,
      ip: req.ip,
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
// CUSTOM VALIDATORS
// ============================================================================

const isEmailAvailable = async (email) => {
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }
  return true;
};

const isEmailAvailableForUpdate = async (email, { req }) => {
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    _id: { $ne: req.params.id },
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Email already in use by another user");
  }
  return true;
};

const isPhoneAvailable = async (phone) => {
  if (!phone) return true;

  const existingUser = await User.findOne({
    phone,
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Phone number already registered");
  }
  return true;
};

const isPhoneAvailableForUpdate = async (phone, { req }) => {
  if (!phone) return true;

  const existingUser = await User.findOne({
    phone,
    _id: { $ne: req.params.id },
    isDeleted: { $ne: true },
  });

  if (existingUser) {
    throw new Error("Phone number already in use by another user");
  }
  return true;
};

const doesUserExist = async (userId, { req }) => {
  const user = await User.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  req.targetUser = user;
  return true;
};

const doesComplaintExist = async (complaintId, { req }) => {
  const complaint = await Complaint.findOne({
    _id: complaintId,
    isDeleted: { $ne: true },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  req.targetComplaint = complaint;
  return true;
};

// ============================================================================
// COMMON RULES
// ============================================================================

const commonRules = {
  name: () =>
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

  nameOptional: () =>
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

  email: () =>
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail()
      .toLowerCase()
      .custom(isEmailAvailable),

  emailOptional: () =>
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail()
      .toLowerCase(),

  password: () =>
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),

  strongPassword: () =>
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
      )
      .withMessage(
        "Password must contain uppercase, lowercase, number, and special character"
      ),

  phone: () =>
    body("phone")
      .optional()
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Phone must be a valid 10-digit Indian mobile number")
      .custom(isPhoneAvailable),

  phoneOptional: () =>
    body("phone")
      .optional()
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Phone must be a valid 10-digit Indian mobile number"),

  role: () =>
    body("role")
      .optional()
      .isIn(["user", "staff", "admin"])
      .withMessage("Invalid role. Must be: user, staff, or admin"),

  mongoId: (paramName = "id") =>
    param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),

  coverId: () =>
    body("coverId")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Cover ID must be between 1 and 50")
      .toInt(),
};

// ============================================================================
// AUTHENTICATION VALIDATORS
// ============================================================================

const registerValidator = [
  commonRules.name(),
  commonRules.email(),
  commonRules.password(),
  commonRules.phone(),
  validate,
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .toLowerCase(),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
  validate,
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .toLowerCase(),
  validate,
];

const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Reset token is required").isString(),
  body("password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
  validate,
];

/**
 * Google OAuth validation
 */
const googleAuthValidator = [
  body("credential")
    .notEmpty()
    .withMessage("Google credential is required")
    .isString()
    .withMessage("Invalid credential format")
    .isLength({ min: 100 })
    .withMessage("Invalid Google credential"),
  body("clientId")
    .optional()
    .isString()
    .withMessage("Client ID must be a string"),
  validate,
];

/**
 * Refresh token validation
 */
const refreshTokenValidator = [
  body("refreshToken")
    .optional()
    .isString()
    .withMessage("Refresh token must be a string")
    .isLength({ min: 20 })
    .withMessage("Invalid refresh token format"),
  validate,
];

/**
 * File upload validation
 */
const fileUploadValidator = (req, res, next) => {
  // Check if file exists
  if (!req.file) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "No file uploaded",
      code: "FILE_REQUIRED",
    });
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "File size too large. Maximum size is 5MB",
      code: "FILE_TOO_LARGE",
      details: {
        fileSize: req.file.size,
        maxSize: maxSize,
        fileSizeMB: (req.file.size / (1024 * 1024)).toFixed(2),
        maxSizeMB: "5.00",
      },
    });
  }

  // Check file type (images only)
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message:
        "Invalid file type. Only images are allowed (JPEG, PNG, WebP, GIF)",
      code: "INVALID_FILE_TYPE",
      details: {
        uploadedType: req.file.mimetype,
        allowedTypes: allowedMimeTypes,
      },
    });
  }

  // Validate file extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const fileExtension = req.file.originalname
    .toLowerCase()
    .substring(req.file.originalname.lastIndexOf("."));

  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Invalid file extension",
      code: "INVALID_FILE_EXTENSION",
      details: {
        uploadedExtension: fileExtension,
        allowedExtensions: allowedExtensions,
      },
    });
  }

  // Check file name length
  if (req.file.originalname.length > 255) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "File name too long. Maximum 255 characters",
      code: "FILENAME_TOO_LONG",
    });
  }

  // All validations passed
  logger.info(`File validation passed: ${req.file.originalname}`, {
    size: req.file.size,
    mimetype: req.file.mimetype,
    userId: req.user?._id,
  });

  next();
};

// ============================================================================
// USER PROFILE VALIDATORS
// ============================================================================

const profileUpdateValidator = [
  commonRules.nameOptional(),
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
  commonRules.coverId(),
  validate,
];

// ============================================================================
// COVER SELECTION VALIDATORS
// ============================================================================

const coverSelectionValidator = [
  body("coverId")
    .notEmpty()
    .withMessage("Cover ID is required")
    .isInt({ min: 1, max: 50 })
    .withMessage("Cover ID must be between 1 and 50")
    .toInt(),
  validate,
];

// ============================================================================
// ADMIN USER MANAGEMENT VALIDATORS
// ============================================================================

const userIdValidator = [
  commonRules.mongoId("id"),
  param("id").custom(doesUserExist),
  validate,
];

const userUpdateValidator = [
  commonRules.nameOptional(),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .toLowerCase()
    .custom(isEmailAvailableForUpdate),
  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone must be a valid 10-digit Indian mobile number")
    .custom(isPhoneAvailableForUpdate),
  commonRules.role(),
  commonRules.coverId(),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value")
    .toBoolean(),
  validate,
];

const updateRoleValidator = [
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["user", "staff", "admin"])
    .withMessage("Invalid role. Must be: user, staff, or admin"),
  body("reason")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be between 10 and 500 characters if provided")
    .escape(),
  validate,
];

const updateStatusValidator = [
  body("isActive")
    .notEmpty()
    .withMessage("Status is required")
    .isBoolean()
    .withMessage("Status must be boolean")
    .toBoolean(),
  validate,
];

const bulkDeleteValidator = [
  body("userIds")
    .isArray({ min: 1, max: 50 })
    .withMessage("userIds must be an array with 1-50 items"),
  body("userIds.*")
    .isMongoId()
    .withMessage("Each user ID must be a valid MongoDB ObjectId"),
  validate,
];

const bulkUpdateValidator = [
  body("userIds").isArray({ min: 1 }).withMessage("User IDs array is required"),
  body("userIds.*").isMongoId().withMessage("Each user ID must be valid"),
  body("updates").isObject().withMessage("Updates object is required"),
  body("updates.coverId")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Cover ID must be between 1 and 50")
    .toInt(),
  body("updates.role")
    .optional()
    .isIn(["user", "staff", "admin"])
    .withMessage("Invalid role"),
  body("updates.isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean")
    .toBoolean(),
  validate,
];

// ============================================================================
// COMPLAINT VALIDATORS
// ============================================================================

const complaintCreateValidator = [
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
    .withMessage("Invalid category"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department cannot exceed 100 characters")
    .escape(),
  body("contactInfo")
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
    .custom((value, { req }) => {
      const contactInfo =
        typeof req.body.contactInfo === "string"
          ? JSON.parse(req.body.contactInfo)
          : req.body.contactInfo;
      return contactInfo?.name && contactInfo.name.trim().length >= 2;
    })
    .withMessage("Contact name is required and must be at least 2 characters"),
  body("contactInfo.email")
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
  validate,
];

const complaintIdValidator = [
  commonRules.mongoId("id"),
  param("id").custom(doesComplaintExist),
  validate,
];

const complaintUpdateValidator = [
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
    .withMessage("Invalid category"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority"),
  body("status")
    .optional()
    .isIn(["pending", "in_progress", "resolved", "rejected", "closed"])
    .withMessage("Invalid status"),
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
  validate,
];

const complaintStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "in_progress", "resolved", "rejected", "closed"])
    .withMessage("Invalid status value"),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Status note cannot exceed 500 characters")
    .escape(),
  validate,
];

const commentValidator = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment must be between 1 and 500 characters")
    .escape(),
  validate,
];

// ============================================================================
// PAGINATION & QUERY VALIDATORS
// ============================================================================

const paginationValidator = [
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
    .withMessage("isActive must be a boolean")
    .toBoolean(),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term cannot exceed 100 characters")
    .escape(),
  validate,
];

const idValidator = [commonRules.mongoId("id"), validate];
// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  validate,

  // Authentication
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  googleAuthValidator, // ADD THIS
  refreshTokenValidator, // ADD THIS

  // Profile
  profileUpdateValidator,
  coverSelectionValidator,
  fileUploadValidator, // ADD THIS

  // User Management
  userIdValidator,
  userUpdateValidator,
  updateRoleValidator,
  updateStatusValidator,
  bulkDeleteValidator,
  bulkUpdateValidator,

  // Complaints
  complaintCreateValidator,
  complaintIdValidator,
  complaintUpdateValidator,
  complaintStatusValidator,
  commentValidator,

  // Pagination & Query
  paginationValidator,
  idValidator,

  // Custom validators
  customValidators: {
    isEmailAvailable,
    isEmailAvailableForUpdate,
    isPhoneAvailable,
    isPhoneAvailableForUpdate,
    doesUserExist,
    doesComplaintExist,
  },

  // Common rules
  commonRules,
};
