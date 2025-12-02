// middleware/errorHandler.js

const logger = require("../utils/logger");

// Base App Error class
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom error subclasses
class BadRequestError extends AppError {
  constructor(message = "Bad Request", errorCode = "BAD_REQUEST") {
    super(message, 400, errorCode);
    this.name = "BadRequestError";
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", errorCode = "UNAUTHORIZED") {
    super(message, 401, errorCode);
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden", errorCode = "FORBIDDEN") {
    super(message, 403, errorCode);
    this.name = "ForbiddenError";
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", errorCode = "NOT_FOUND") {
    super(message, 404, errorCode);
    this.name = "NotFoundError";
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict", errorCode = "CONFLICT") {
    super(message, 409, errorCode);
    this.name = "ConflictError";
  }
}

class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    errors = [],
    errorCode = "VALIDATION_ERROR"
  ) {
    super(message, 422, errorCode);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal Server Error", errorCode = "INTERNAL_ERROR") {
    super(message, 500, errorCode);
    this.name = "InternalServerError";
    this.isOperational = false;
  }
}

// Helpers for specific error types e.g. Mongoose, JWT, Multer (implement as needed)

const isOperationalError = (error) =>
  error instanceof AppError && error.isOperational;

// Async error wrapper for routes
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack;

  // Defaults
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || "INTERNAL_ERROR";
  let message = err.message || "Internal Server Error";

  // Custom error processing (Mongoose, JWT etc.) can go here

  // Update error with processed values
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  error.message = message;

  const logContext = {
    statusCode,
    errorCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?._id || req.user?.id || "anonymous",
    userAgent: req.get("user-agent"),
  };

  // Log error based on severity
  if (statusCode >= 500) {
    logger.error(`[${errorCode}] ${message}`, {
      ...logContext,
      stack: error.stack,
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!isOperationalError(error)) {
      logger.error("Non-operational error detected", {
        ...logContext,
        message,
        stack: error.stack,
      });
    }
  } else if (statusCode >= 400) {
    logger.warn(`[${errorCode}] ${message}`, logContext);
  } else {
    logger.info(`[${errorCode}] ${message}`, logContext);
  }

  // Format response for client
  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
    timestamp: error.timestamp || new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  if (error.errors && Array.isArray(error.errors)) {
    response.error.details = error.errors;
  }

  if (error.field) {
    response.error.field = error.field;
  }

  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    response.error.message =
      "An unexpected error occurred. Please try again later.";
  }

  res.status(statusCode).json(response);
};

// 404 Not Found Middleware
const notFound = (req, res, next) => {
  const err = new NotFoundError(
    `Cannot ${req.method} ${req.originalUrl}. The requested resource was not found.`
  );
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next(err);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  isOperationalError,
};
