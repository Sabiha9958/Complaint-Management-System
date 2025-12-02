/**
 * File Upload Middleware
 * Handles file uploads securely with Multer.
 */

const path = require("path");
const multer = require("multer");
const logger = require("../utils/logger");

// Allowed file types
const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;

/**
 * File filter to validate file type
 */
const fileFilter = (req, file, cb) => {
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    logger.warn(`Invalid file upload attempt: ${file.originalname}`);
    cb(new Error("Invalid file type. Only images and documents are allowed."));
  }
};

/**
 * Storage configuration
 * Files are stored in /uploads with unique names
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

/**
 * Multer upload instance
 * Limits file size to 5MB
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/**
 * Middleware wrapper for single file upload
 * @param {string} fieldName - The field name in form-data
 */
const uploadSingle = (fieldName) => (req, res, next) => {
  const singleUpload = upload.single(fieldName);
  singleUpload(req, res, (err) => {
    if (err) {
      logger.error("File upload error:", err.message);
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

/**
 * Middleware wrapper for multiple file uploads
 * @param {string} fieldName - The field name in form-data
 * @param {number} maxCount - Maximum number of files
 */
const uploadMultiple =
  (fieldName, maxCount = 5) =>
  (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    multipleUpload(req, res, (err) => {
      if (err) {
        logger.error("File upload error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };

module.exports = { uploadSingle, uploadMultiple };
