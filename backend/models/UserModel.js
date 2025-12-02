/**
 * ================================================================
 * 👤 USER MODEL - Production Ready
 * ================================================================
 * Comprehensive user model with authentication, roles, profile management,
 * Google OAuth support, cover selection, and soft delete functionality.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");

// ================================================================
// 📋 SCHEMA DEFINITION
// ================================================================
const userSchema = new mongoose.Schema(
  {
    // 🆔 BASIC IDENTITY
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
    },

    // 🔐 AUTHENTICATION
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // 🌐 GOOGLE OAUTH
    googleId: { type: String },
    profilePicture: {
      type: String,
      default: null,
    },

    // 👔 ROLE & ACCESS CONTROL
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
      index: true,
    },

    // 📝 PROFILE INFORMATION
    title: { type: String, trim: true, maxlength: 120 },
    department: { type: String, trim: true, maxlength: 100 },
    location: { type: String, trim: true, maxlength: 200 },
    bio: { type: String, trim: true, maxlength: 1000 },

    // 🖼️ AVATAR & COVER IMAGES
    avatar: {
      filename: String,
      url: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now },
    },

    // 🎨 COVER IMAGE - Predefined selection (1-50)
    coverId: {
      type: Number,
      min: 1,
      max: 50,
      default: null,
    },

    // Legacy cover image upload support (deprecated in favor of coverId)
    coverImage: {
      filename: String,
      url: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now },
    },

    image: { type: String, trim: true }, // Legacy avatar support

    // 🔒 ACCOUNT STATUS & SECURITY
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpire: { type: Date, select: false },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLogin: { type: Date },
    lastPasswordChange: { type: Date },

    // 🗑️ SOFT DELETE
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: { type: Date },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🔑 PASSWORD RESET
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    // 📊 METADATA
    lastActiveAt: { type: Date, default: Date.now },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: { type: String, default: "en" },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ================================================================
// 📇 INDEXES FOR PERFORMANCE
// ================================================================
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ coverId: 1 });

// ================================================================
// 🎭 VIRTUAL PROPERTIES
// ================================================================

/**
 * Get avatar URL with priority: Google > uploaded > generated
 */
userSchema.virtual("avatarUrl").get(function () {
  // Priority: Google profile picture > uploaded avatar > generated avatar
  if (this.profilePicture) return this.profilePicture;
  if (this.avatar?.url) return this.avatar.url;
  if (this.image) return this.image;

  // Generate avatar from initials
  const initials = this.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=random&size=200&bold=true`;
});

/**
 * Get cover image URL (predefined covers from coverId)
 */
userSchema.virtual("coverUrl").get(function () {
  // Priority: Selected cover ID > legacy uploaded cover > default gradient
  if (this.coverId) {
    // Import cover images data
    const COVER_BASE_URL = "https://images.unsplash.com/photo-";
    const coverMap = {
      1: "1506905925346-21bda4d32df4?w=1600&h=400&fit=crop",
      2: "1469474968028-56623f02e42e?w=1600&h=400&fit=crop",
      3: "1441974231531-c6227db76b6e?w=1600&h=400&fit=crop",
      4: "1470071459604-3b5ec3a7fe05?w=1600&h=400&fit=crop",
      5: "1426604966848-d7adac402bff?w=1600&h=400&fit=crop",
      6: "1472214103451-9374bd1c798e?w=1600&h=400&fit=crop",
      7: "1511884642898-4c92249e20b6?w=1600&h=400&fit=crop",
      8: "1501594907352-04cda38ebc29?w=1600&h=400&fit=crop",
      9: "1483728642387-6c3bdd6c93e5?w=1600&h=400&fit=crop",
      10: "1475924156734-496f6cac6ec1?w=1600&h=400&fit=crop",
      // Add all 50 mappings or use a function to generate URL
    };

    return coverMap[this.coverId]
      ? `${COVER_BASE_URL}${coverMap[this.coverId]}`
      : null;
  }

  // Legacy: uploaded cover image
  if (this.coverImage?.url) return this.coverImage.url;

  // Default: no cover (frontend will show gradient)
  return null;
});

/**
 * Check if user has custom avatar
 */
userSchema.virtual("hasCustomAvatar").get(function () {
  return !!(this.profilePicture || this.avatar?.url || this.image);
});

/**
 * Check if user has custom cover
 */
userSchema.virtual("hasCustomCover").get(function () {
  return !!(this.coverId || this.coverImage?.url);
});

/**
 * Get display name with title
 */
userSchema.virtual("displayName").get(function () {
  return this.title ? `${this.title} ${this.name}` : this.name;
});

/**
 * Check if account is locked
 */
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Get account age in days
 */
userSchema.virtual("accountAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

/**
 * Get human-readable last active time
 */
userSchema.virtual("lastActiveHuman").get(function () {
  if (!this.lastActiveAt) return "Never";
  const seconds = Math.floor((Date.now() - this.lastActiveAt) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
});

// ================================================================
// 🎣 PRE-SAVE HOOKS
// ================================================================

/**
 * Assign random cover on new user registration
 */
userSchema.pre("save", function (next) {
  if (this.isNew && !this.coverId) {
    // Assign random cover ID between 1-50
    this.coverId = Math.floor(Math.random() * 50) + 1;
    console.log(
      `✅ Assigned random cover ID ${this.coverId} to new user: ${this.email}`
    );
  }
  next();
});

/**
 * Hash password before saving
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    this.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Trim and normalize string fields
 */
userSchema.pre("save", function (next) {
  if (this.name) this.name = this.name.trim();
  if (this.email) this.email = this.email.trim().toLowerCase();
  if (this.phone) this.phone = this.phone.trim();
  if (this.title) this.title = this.title.trim();
  if (this.department) this.department = this.department.trim();
  if (this.location) this.location = this.location.trim();
  if (this.bio) this.bio = this.bio.trim();
  next();
});

/**
 * Update last active timestamp on login
 */
userSchema.pre("save", function (next) {
  if (this.isModified("lastLogin")) {
    this.lastActiveAt = new Date();
  }
  next();
});

/**
 * Validate coverId range
 */
userSchema.pre("save", function (next) {
  if (this.coverId !== null && this.coverId !== undefined) {
    if (this.coverId < 1 || this.coverId > 50) {
      return next(new Error("Cover ID must be between 1 and 50"));
    }
  }
  next();
});

// ================================================================
// 🗑️ PRE-REMOVE HOOKS
// ================================================================
userSchema.pre("deleteOne", { document: true }, async function () {
  try {
    // Clean up avatar files
    if (this.avatar?.path && fs.existsSync(this.avatar.path)) {
      fs.unlinkSync(this.avatar.path);
      console.log(`✅ Deleted avatar: ${this.avatar.filename}`);
    }

    // Clean up legacy cover image files (if any)
    if (this.coverImage?.path && fs.existsSync(this.coverImage.path)) {
      fs.unlinkSync(this.coverImage.path);
      console.log(`✅ Deleted cover image: ${this.coverImage.filename}`);
    }
  } catch (error) {
    console.error("❌ Error deleting user files:", error);
  }
});

// ================================================================
// 🔐 AUTHENTICATION METHODS
// ================================================================

/**
 * Compare entered password with hashed password
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate signed JWT token
 */
userSchema.methods.getSignedJwtToken = function () {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
      name: this.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

/**
 * Check if password was changed after JWT was issued
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.lastPasswordChange) {
    const changedTimestamp = Math.floor(
      this.lastPasswordChange.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// ================================================================
// 🔒 ACCOUNT SECURITY METHODS
// ================================================================

/**
 * Increment login attempts and lock account if needed
 */
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts = (this.loginAttempts || 0) + 1;

    // Lock account after max attempts
    if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      this.lockUntil = Date.now() + LOCK_TIME;
    }
  }

  await this.save({ validateBeforeSave: false });
};

/**
 * Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts === 0 && !this.lockUntil) return;

  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  this.lastActiveAt = new Date();

  await this.save({ validateBeforeSave: false });
};

// ================================================================
// 🖼️ AVATAR & COVER IMAGE MANAGEMENT
// ================================================================

/**
 * Update user avatar
 */
userSchema.methods.updateAvatar = async function (file, req) {
  // Delete old avatar file if exists
  if (this.avatar?.path && fs.existsSync(this.avatar.path)) {
    try {
      fs.unlinkSync(this.avatar.path);
      console.log(`✅ Deleted old avatar: ${this.avatar.filename}`);
    } catch (error) {
      console.error("❌ Error deleting old avatar:", error);
    }
  }

  // Set new avatar
  this.avatar = {
    filename: file.filename,
    url: `${req.protocol}://${req.get("host")}/uploads/avatars/${
      file.filename
    }`,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };

  // Legacy support
  this.image = this.avatar.url;

  await this.save({ validateBeforeSave: false });
  return this.avatar;
};

/**
 * Delete user avatar
 */
userSchema.methods.deleteAvatar = async function () {
  if (this.avatar?.path && fs.existsSync(this.avatar.path)) {
    try {
      fs.unlinkSync(this.avatar.path);
      console.log(`✅ Deleted avatar: ${this.avatar.filename}`);
    } catch (error) {
      console.error("❌ Error deleting avatar:", error);
    }
  }

  this.avatar = undefined;
  this.image = undefined;
  await this.save({ validateBeforeSave: false });
};

/**
 * Update cover image selection (predefined covers)
 */
userSchema.methods.updateCoverSelection = async function (coverId) {
  if (coverId < 1 || coverId > 50) {
    throw new Error("Invalid cover ID. Must be between 1 and 50.");
  }

  this.coverId = coverId;
  await this.save({ validateBeforeSave: false });

  console.log(`✅ User ${this.email} updated cover to ID: ${coverId}`);
  return this.coverId;
};

/**
 * Reset to random cover
 */
userSchema.methods.resetCoverToRandom = async function () {
  this.coverId = Math.floor(Math.random() * 50) + 1;
  await this.save({ validateBeforeSave: false });

  console.log(
    `✅ User ${this.email} reset to random cover ID: ${this.coverId}`
  );
  return this.coverId;
};

/**
 * Legacy: Update cover image (deprecated - use coverId instead)
 */
userSchema.methods.updateCoverImage = async function (file, req) {
  console.warn(
    "⚠️ updateCoverImage is deprecated. Use coverId selection instead."
  );

  // Delete old cover if exists
  if (this.coverImage?.path && fs.existsSync(this.coverImage.path)) {
    try {
      fs.unlinkSync(this.coverImage.path);
      console.log(`✅ Deleted old cover: ${this.coverImage.filename}`);
    } catch (error) {
      console.error("❌ Error deleting old cover:", error);
    }
  }

  // Set new cover image
  this.coverImage = {
    filename: file.filename,
    url: `${req.protocol}://${req.get("host")}/uploads/covers/${file.filename}`,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };

  await this.save({ validateBeforeSave: false });
  return this.coverImage;
};

// ================================================================
// 🔑 PASSWORD RESET & EMAIL VERIFICATION
// ================================================================

/**
 * Generate password reset token
 */
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

/**
 * Generate email verification token
 */
userSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// ================================================================
// 🛡️ UTILITY METHODS
// ================================================================

/**
 * Get safe user object (without sensitive data)
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  delete obj.loginAttempts;
  delete obj.lockUntil;

  return obj;
};

/**
 * Check if user has permission for a role
 */
userSchema.methods.hasPermission = function (requiredRole) {
  const roles = { user: 1, staff: 2, admin: 3 };
  return roles[this.role] >= roles[requiredRole];
};

/**
 * Update last active timestamp
 */
userSchema.methods.updateLastActive = async function () {
  this.lastActiveAt = new Date();
  await this.save({ validateBeforeSave: false });
};

// ================================================================
// 📤 EXPORT MODEL
// ================================================================
const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;
