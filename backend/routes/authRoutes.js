/**
 * ================================================================
 * 🔐 AUTHENTICATION & USER MANAGEMENT ROUTES
 * ================================================================
 */

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const validators = require("../middleware/validator");
const { authLimiter, sensitiveLimiter } = require("../middleware/rateLimiter");
const upload = require("../middleware/uploadMiddleware");

// ============================================================================
// ROUTE PARAM VALIDATORS
// ============================================================================

router.param("id", (req, res, next, id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
  }
  next();
});

// ============================================================================
// PUBLIC ROUTES - Authentication
// ============================================================================

router.post(
  "/register",
  authLimiter,
  validators.registerValidator,
  authController.register
);
router.post(
  "/login",
  authLimiter,
  validators.loginValidator,
  authController.login
);
router.post("/google", authLimiter, authController.googleAuth);
router.post("/refresh", authLimiter, authController.refreshToken);
router.post("/logout", authController.logout);

// ============================================================================
// PUBLIC ROUTES - Password Recovery
// ============================================================================

router.post(
  "/forgot-password",
  sensitiveLimiter,
  validators.forgotPasswordValidator,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  sensitiveLimiter,
  validators.resetPasswordValidator,
  authController.resetPassword
);

// ============================================================================
// PROTECTED ROUTES - Current User Profile
// ============================================================================

router.get("/me", protect, authController.getMe);
router.put(
  "/me",
  protect,
  validators.profileUpdateValidator,
  authController.updateProfile
);
router.put(
  "/change-password",
  protect,
  sensitiveLimiter,
  validators.changePasswordValidator,
  authController.changePassword
);

// ============================================================================
// PROTECTED ROUTES - Profile Media
// ============================================================================

router.put(
  "/me/profile-picture",
  protect,
  upload.single("profilePicture"),
  authController.updateProfilePicture
);
router.delete(
  "/me/profile-picture",
  protect,
  authController.deleteProfilePicture
);

router.put(
  "/me/cover-image",
  protect,
  upload.single("coverImage"),
  authController.updateCoverImage
);
router.delete("/me/cover-image", protect, authController.deleteCoverImage);

// ============================================================================
// PROTECTED ROUTES - Team
// ============================================================================

router.get("/team", protect, authController.getTeamMembers);

// ============================================================================
// ADMIN ROUTES - User Management
// ============================================================================

router.get(
  "/users",
  protect,
  authorize("admin", "staff"),
  validators.paginationValidator,
  authController.getAllUsers
);
router.get(
  "/users/:id",
  protect,
  authorize("admin"),
  validators.userIdValidator,
  authController.getUserById
);
router.put(
  "/users/:id",
  protect,
  authorize("admin"),
  validators.userIdValidator,
  validators.userUpdateValidator,
  authController.updateUser
);
router.patch(
  "/users/:id/role",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  validators.userIdValidator,
  validators.updateRoleValidator,
  authController.updateUserRole
);
router.delete(
  "/users/:id",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  validators.userIdValidator,
  authController.deleteUser
);
router.post(
  "/users/bulk-delete",
  protect,
  authorize("admin"),
  sensitiveLimiter,
  validators.bulkDeleteValidator,
  authController.bulkDeleteUsers
);

// ============================================================================
// 404 HANDLER
// ============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Authentication endpoint not found",
    path: req.originalUrl,
  });
});

module.exports = router;
