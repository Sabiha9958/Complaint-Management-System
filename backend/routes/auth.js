/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  changePassword,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validator");
const { authLimiter } = require("../middleware/rateLimiter");

// Public routes
router.post("/register", authLimiter, validateRegistration, register);
router.post("/login", authLimiter, validateLogin, login);

// Protected routes
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logout);

module.exports = router;
