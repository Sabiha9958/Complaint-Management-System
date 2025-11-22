/**
 * Global Error Handler Middleware
 * Catches and formats all errors in the application
 */

/**
 * Error response formatter
 */
const errorResponse = (err, req, res) => {
  const error = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    error.stack = err.stack;
    error.error = err;
  }

  res.status(err.statusCode || 500).json(error);
};

/**
 * Global error handler
 * Must be defined after all routes
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Set default status code
  err.statusCode = err.statusCode || 500;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    err.message = "Resource not found";
    err.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.message = `Duplicate field value: ${field}. Please use another value.`;
    err.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    err.message = `Validation Error: ${messages.join(", ")}`;
    err.statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    err.message = "Invalid token. Please login again.";
    err.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    err.message = "Token expired. Please login again.";
    err.statusCode = 401;
  }

  errorResponse(err, req, res);
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};
