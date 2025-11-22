/**
 * Multer Upload Error Handler Middleware
 * Handles file upload errors with user-friendly messages
 */

const multer = require("multer");

/**
 * Handle multer-specific errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: "File size too large. Maximum size is 5MB per file.",
        });

      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum 10 files allowed.",
        });

      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: `Unexpected field: ${err.field}. Use 'files' or 'file' as field name.`,
        });

      default:
        return res.status(400).json({
          success: false,
          message: "File upload error",
          error: err.message,
        });
    }
  } else if (err) {
    // Custom validation errors
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

module.exports = handleUploadError;
