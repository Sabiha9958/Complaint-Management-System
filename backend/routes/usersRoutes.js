/**
 * ================================================================
 * 👤 USER ROUTES
 * ================================================================
 * Base: /api/users
 * Handles user profile management and admin operations
 * ================================================================
 */

const express = require("express");
const router = express.Router();

// ============================================================================
// IMPORTS
// ============================================================================

// Controllers
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  uploadAvatarController,
  deleteAvatar,
  uploadCoverImageController,
  updateProfileWithAvatar,
  getUserStats,
  bulkUserAction,
} = require("../controllers/userController");

// Middleware
const { protect, authorize } = require("../middleware/auth");
const {
  profileUpdateValidation,
  userUpdateValidation,
  userIdValidation,
  paginationValidation,
} = require("../middleware/validation");
const {
  authLimiter,
  sensitiveLimiter,
  uploadLimiter,
} = require("../middleware/rateLimiter");
const {
  uploadAvatar,
  uploadCover,
  handleMulterError,
  cleanupUploadedFiles,
} = require("../middleware/uploadMiddleware");

// ============================================================================
// CURRENT USER ROUTES (Must be before /:id routes)
// ============================================================================

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", protect, getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  "/me",
  protect,
  sensitiveLimiter,
  profileUpdateValidation,
  updateProfile
);

/**
 * @route   PUT /api/users/me/profile
 * @desc    Update profile with avatar (multipart)
 * @access  Private
 */
router.put(
  "/me/profile",
  protect,
  uploadLimiter,
  cleanupUploadedFiles,
  uploadAvatar,
  handleMulterError,
  updateProfileWithAvatar
);

/**
 * @route   POST /api/users/me/avatar
 * @desc    Upload/update avatar
 * @access  Private
 */
router.post(
  "/me/avatar",
  protect,
  uploadLimiter,
  cleanupUploadedFiles,
  uploadAvatar,
  handleMulterError,
  uploadAvatarController
);

/**
 * @route   DELETE /api/users/me/avatar
 * @desc    Remove avatar
 * @access  Private
 */
router.delete("/me/avatar", protect, sensitiveLimiter, deleteAvatar);

/**
 * @route   POST /api/users/me/cover
 * @desc    Upload/update cover image
 * @access  Private
 */
router.post(
  "/me/cover",
  protect,
  uploadLimiter,
  cleanupUploadedFiles,
  uploadCover,
  handleMulterError,
  uploadCoverImageController
);

// ============================================================================
// ADMIN & STAFF ROUTES
// ============================================================================

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin/Staff
 */
router.get("/stats", protect, authorize("admin", "staff"), getUserStats);

/**
 * @route   POST /api/users/bulk
 * @desc    Bulk user actions (activate, deactivate, verify)
 * @access  Private/Admin/Staff
 */
router.post(
  "/bulk",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  bulkUserAction
);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private/Admin/Staff
 */
router.get(
  "/",
  protect,
  authorize("admin", "staff"),
  paginationValidation,
  getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin/Staff
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "staff"),
  userIdValidation,
  getUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private/Admin/Staff
 */
router.put(
  "/:id",
  protect,
  authorize("admin", "staff"),
  sensitiveLimiter,
  userIdValidation,
  userUpdateValidation,
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (permanent)
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  userIdValidation,
  deleteUser
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
});

module.exports = router;
