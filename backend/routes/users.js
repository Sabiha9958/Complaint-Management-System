/**
 * User Routes
 */

const express = require("express");
const router = express.Router();
const {
  updateProfile,
  getAllUsers,
  getUserStats,
  getStaffUsers,
  getUserById,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validator");

// Protected routes - All authenticated users
router.put("/profile", protect, updateProfile);

// Protected routes - Admin only
router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/stats", protect, authorize("admin"), getUserStats); // Add this
router.get("/staff", protect, authorize("admin"), getStaffUsers);
router.get("/:id", protect, authorize("admin"), validateObjectId, getUserById);
router.put("/:id", protect, authorize("admin"), validateObjectId, updateUser);
router.put(
  "/:id/role",
  protect,
  authorize("admin"),
  validateObjectId,
  updateUserRole
);
router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  validateObjectId,
  toggleUserStatus
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  validateObjectId,
  deleteUser
);

module.exports = router;
