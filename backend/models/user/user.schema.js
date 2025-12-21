const mongoose = require("mongoose");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, "Invalid email"],
    },
    phone: {
      type: String,
      trim: true,
      match: [phoneRegex, "Phone must be 10 digits"],
    },

    password: { type: String, minlength: 6, select: false },
    googleId: { type: String }, // keep undefined when not used
    refreshToken: { type: String, select: false },

    profilePicture: { type: String, trim: true },

    title: { type: String, trim: true, maxlength: 100 },
    department: { type: String, trim: true, maxlength: 100 },
    location: { type: String, trim: true, maxlength: 100 },
    bio: { type: String, trim: true, maxlength: 1000 },

    coverId: { type: Number, default: 1, min: 1, max: 50 },

    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
      index: true,
    },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },

    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    emailVerificationToken: { type: String },
    emailVerificationExpire: { type: Date },
    isEmailVerified: { type: Boolean, default: false },

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    lastLogin: { type: Date },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    roleChangedAt: { type: Date },
    roleChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    roleChangeReason: { type: String, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

module.exports = userSchema;
