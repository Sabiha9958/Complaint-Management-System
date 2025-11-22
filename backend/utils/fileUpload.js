/**
 * File Upload Utility
 * Handles file uploads with comprehensive validation and error handling
 * Uses Multer for multipart/form-data processing
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * ============================================
 * UPLOAD DIRECTORY CONFIGURATION
 * ============================================
 */

// Define upload directories
const uploadDirectories = {
  complaints: "./uploads/complaints",
  profiles: "./uploads/profiles",
  documents: "./uploads/documents",
  temp: "./uploads/temp",
};

/**
 * Create upload directories if they don't exist
 * Ensures all necessary folders are present before file uploads
 */
const createUploadDirectories = () => {
  Object.values(uploadDirectories).forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created upload directory: ${dir}`);
    }
  });

  // Create .gitkeep file to preserve directory in git
  const gitkeepPath = path.join("./uploads", ".gitkeep");
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, "");
  }
};

// Initialize directories on module load
createUploadDirectories();

/**
 * ============================================
 * STORAGE CONFIGURATION
 * ============================================
 */

/**
 * Configure storage for complaint attachments
 */
const complaintStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectories.complaints);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    // Sanitize filename - remove special characters
    const sanitizedName = nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50); // Limit length

    const filename = `complaint-${sanitizedName}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

/**
 * ============================================
 * FILE TYPE VALIDATION
 * ============================================
 */

/**
 * Comprehensive MIME type mappings
 */
const allowedMimeTypes = {
  images: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
};

/**
 * File extension mappings
 */
const allowedExtensions = {
  images: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"],
};

/**
 * File filter for complaint attachments
 * Allows images and documents
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    ...allowedMimeTypes.images,
    ...allowedMimeTypes.documents,
  ];

  const allowedExts = [
    ...allowedExtensions.images,
    ...allowedExtensions.documents,
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  // Check both MIME type and extension
  if (allowedTypes.includes(mimeType) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.originalname}. Allowed: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX, XLS, XLSX, TXT)`
      ),
      false
    );
  }
};

/**
 * ============================================
 * MULTER CONFIGURATION
 * ============================================
 */

/**
 * Main multer upload configuration
 */
const upload = multer({
  storage: complaintStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Maximum 10 files per request
  },
});

/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 */

/**
 * Delete file from filesystem
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`✓ Deleted file: ${filePath}`);
      return true;
    }
    console.log(`⚠ File not found: ${filePath}`);
    return false;
  } catch (error) {
    console.error(`❌ Failed to delete file: ${filePath}`, error.message);
    return false;
  }
};

/**
 * Delete multiple files
 * @param {Array<Object>} attachments - Array of attachment objects with path property
 * @returns {Promise<Object>} - Result with success count
 */
const deleteMultipleFiles = async (attachments) => {
  const results = {
    deleted: 0,
    failed: 0,
    errors: [],
  };

  for (const attachment of attachments) {
    const filePath = attachment.path || attachment;
    try {
      const success = await deleteFile(filePath);
      if (success) {
        results.deleted++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ filePath, error: error.message });
    }
  }

  return results;
};

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Validate file information
 * @param {Object} file - Multer file object
 * @returns {Object} - Validation result
 */
const validateFile = (file) => {
  const result = {
    valid: true,
    errors: [],
  };

  if (!file) {
    result.valid = false;
    result.errors.push("No file provided");
    return result;
  }

  if (file.size > 5 * 1024 * 1024) {
    result.valid = false;
    result.errors.push("File size exceeds 5MB limit");
  }

  if (file.originalname.length > 255) {
    result.valid = false;
    result.errors.push("Filename too long (max 255 characters)");
  }

  return result;
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} - File extension
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

/**
 * Check if file is an image
 * @param {string} mimetype - File MIME type
 * @returns {boolean} - True if image
 */
const isImage = (mimetype) => {
  return allowedMimeTypes.images.includes(mimetype.toLowerCase());
};

/**
 * Check if file is a document
 * @param {string} mimetype - File MIME type
 * @returns {boolean} - True if document
 */
const isDocument = (mimetype) => {
  return allowedMimeTypes.documents.includes(mimetype.toLowerCase());
};

/**
 * ============================================
 * EXPORTS
 * ============================================
 */

module.exports = upload;

// Also export utility functions and configurations
module.exports.upload = upload;
module.exports.uploadSingle = upload.single("file");
module.exports.uploadMultiple = upload.array("files", 10);
module.exports.uploadFields = upload.fields;

// Utility exports
module.exports.deleteFile = deleteFile;
module.exports.deleteMultipleFiles = deleteMultipleFiles;
module.exports.formatFileSize = formatFileSize;
module.exports.validateFile = validateFile;
module.exports.getFileExtension = getFileExtension;
module.exports.isImage = isImage;
module.exports.isDocument = isDocument;

// Configuration exports
module.exports.uploadDirectories = uploadDirectories;
module.exports.allowedMimeTypes = allowedMimeTypes;
module.exports.allowedExtensions = allowedExtensions;
