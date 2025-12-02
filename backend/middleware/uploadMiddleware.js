/**
 * ================================================================
 * 📁 FILE UPLOAD MIDDLEWARE
 * ================================================================
 * Handles file uploads for:
 * - Profile pictures (avatars)
 * - Cover images
 * - Complaint attachments
 *
 * Features:
 * - Automatic directory creation
 * - File type validation
 * - Size limits
 * - Unique filename generation
 * - Optional image optimization
 * - Automatic cleanup on errors
 * ================================================================
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/* ================================================================
   DIRECTORY SETUP
   ================================================================ */

const UPLOAD_BASE = path.join(__dirname, "..", "uploads");

const uploadDirs = {
  profilePictures: path.join(UPLOAD_BASE, "profile-pictures"),
  coverImages: path.join(UPLOAD_BASE, "cover-images"),
  complaints: path.join(UPLOAD_BASE, "complaints"),
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created upload directory: ${dir}`);
  }
});

/* ================================================================
   STORAGE CONFIGURATIONS
   ================================================================ */

// Profile Picture Storage
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.profilePictures);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || req.user?._id || "anonymous";
    const uniqueName = `profile-${userId}-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

// Cover Image Storage
const coverImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.coverImages);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || req.user?._id || "anonymous";
    const uniqueName = `cover-${userId}-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

// Complaint Attachments Storage
const complaintStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.complaints);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const uniqueName = `complaint-${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}-${baseName}${ext}`;
    cb(null, uniqueName);
  },
});

/* ================================================================
   FILE FILTERS
   ================================================================ */

// Image Filter (for profile pictures and covers)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
      ),
      false
    );
  }
};

// Complaint Attachments Filter (images + PDFs)
const complaintFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DOC, DOCX"
      ),
      false
    );
  }
};

/* ================================================================
   MULTER INSTANCES
   ================================================================ */

// Single upload for profile picture
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Determine destination based on field name
      let destDir = uploadDirs.profilePictures;

      if (file.fieldname === "coverImage") {
        destDir = uploadDirs.coverImages;
      } else if (file.fieldname === "attachments") {
        destDir = uploadDirs.complaints;
      }

      cb(null, destDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const userId = req.user?.id || req.user?._id || "anonymous";
      const timestamp = Date.now();
      const random = crypto.randomBytes(6).toString("hex");

      let prefix = "file";
      if (file.fieldname === "profilePicture") prefix = "profile";
      else if (file.fieldname === "coverImage") prefix = "cover";
      else if (file.fieldname === "attachments") prefix = "complaint";

      const uniqueName = `${prefix}-${userId}-${timestamp}-${random}${ext}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Use appropriate filter based on field name
    if (file.fieldname === "attachments") {
      complaintFileFilter(req, file, cb);
    } else {
      imageFileFilter(req, file, cb);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default
  },
});

// Legacy named exports for backward compatibility
const uploadAvatar = multer({
  storage: profilePictureStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("avatar");

const uploadCover = multer({
  storage: coverImageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("cover");

const uploadComplaintAttachments = multer({
  storage: complaintStorage,
  fileFilter: complaintFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Max 10 files
  },
}).array("attachments", 10);

/* ================================================================
   ERROR HANDLER
   ================================================================ */

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = "File upload error";
    let statusCode = 400;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File size too large. Maximum allowed size is 10MB.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Maximum 10 files allowed.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = `Unexpected file field: ${err.field}`;
        break;
      case "LIMIT_PART_COUNT":
        message = "Too many parts in the form.";
        break;
      default:
        message = err.message;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      code: err.code,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
      code: "UPLOAD_ERROR",
    });
  }

  next();
};

/* ================================================================
   CLEANUP MIDDLEWARE
   ================================================================ */

const cleanupUploadedFiles = (req, res, next) => {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const cleanup = () => {
    if (res.statusCode >= 400) {
      // Delete single file
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`🗑️ Cleaned up failed upload: ${req.file.filename}`);
        } catch (error) {
          console.error("Error cleaning up file:", error);
        }
      }

      // Delete multiple files
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(`🗑️ Cleaned up failed upload: ${file.filename}`);
            } catch (error) {
              console.error("Error cleaning up file:", error);
            }
          }
        });
      }
    }
  };

  res.json = function (data) {
    cleanup();
    return originalJson(data);
  };

  res.send = function (data) {
    cleanup();
    return originalSend(data);
  };

  next();
};

/* ================================================================
   IMAGE OPTIMIZATION (Optional - requires sharp)
   ================================================================ */

const optimizeAvatar = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const sharp = require("sharp");
    const outputPath = req.file.path.replace(
      path.extname(req.file.path),
      "-optimized.jpg"
    );

    await sharp(req.file.path)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);

    // Delete original, use optimized
    fs.unlinkSync(req.file.path);
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);

    console.log(`✅ Optimized avatar: ${req.file.filename}`);
    next();
  } catch (error) {
    console.warn("⚠️ Avatar optimization skipped:", error.message);
    next();
  }
};

const optimizeCover = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const sharp = require("sharp");
    const outputPath = req.file.path.replace(
      path.extname(req.file.path),
      "-optimized.jpg"
    );

    await sharp(req.file.path)
      .resize(1200, 400, {
        fit: "cover",
        position: "center",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(outputPath);

    // Delete original, use optimized
    fs.unlinkSync(req.file.path);
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);

    console.log(`✅ Optimized cover: ${req.file.filename}`);
    next();
  } catch (error) {
    console.warn("⚠️ Cover optimization skipped:", error.message);
    next();
  }
};

/* ================================================================
   UTILITY FUNCTIONS
   ================================================================ */

/**
 * Delete a file from the uploads directory
 */
const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

/**
 * Get file path from URL
 */
const getFilePathFromUrl = (url) => {
  if (!url) return null;

  const filename = path.basename(url);

  // Check in all upload directories
  for (const dir of Object.values(uploadDirs)) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
};

/* ================================================================
   EXPORTS
   ================================================================ */

module.exports = upload;

// Named exports for specific use cases
module.exports.uploadAvatar = uploadAvatar;
module.exports.uploadCover = uploadCover;
module.exports.uploadComplaintAttachments = uploadComplaintAttachments;

// Middleware
module.exports.handleMulterError = handleMulterError;
module.exports.cleanupUploadedFiles = cleanupUploadedFiles;
module.exports.optimizeAvatar = optimizeAvatar;
module.exports.optimizeCover = optimizeCover;

// Utilities
module.exports.deleteFile = deleteFile;
module.exports.getFilePathFromUrl = getFilePathFromUrl;
module.exports.uploadDirs = uploadDirs;
