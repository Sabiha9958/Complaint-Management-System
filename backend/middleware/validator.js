/**
 * Request Validation Middleware
 * Validates request body, params, and query parameters
 */

/**
 * Validate complaint creation
 */
exports.validateComplaint = (req, res, next) => {
  const { title, description, category, contactInfo } = req.body;

  const errors = [];

  if (!title || title.trim().length < 5) {
    errors.push("Title must be at least 5 characters long");
  }

  if (title && title.length > 200) {
    errors.push("Title cannot exceed 200 characters");
  }

  if (!description || description.trim().length < 10) {
    errors.push("Description must be at least 10 characters long");
  }

  if (description && description.length > 2000) {
    errors.push("Description cannot exceed 2000 characters");
  }

  if (!category) {
    errors.push("Category is required");
  }

  const validCategories = [
    "Infrastructure",
    "Academic",
    "Hostel",
    "Transport",
    "Canteen",
    "Library",
    "IT Services",
    "Security",
    "Other",
  ];

  if (category && !validCategories.includes(category)) {
    errors.push(
      `Invalid category. Must be one of: ${validCategories.join(", ")}`
    );
  }

  if (!contactInfo || !contactInfo.name || !contactInfo.email) {
    errors.push("Contact information (name and email) is required");
  }

  if (contactInfo && contactInfo.email) {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(contactInfo.email)) {
      errors.push("Invalid email format");
    }
  }

  if (contactInfo && contactInfo.phone) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contactInfo.phone)) {
      errors.push("Phone number must be exactly 10 digits");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

/**
 * Validate user registration
 */
exports.validateRegistration = (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (name && name.length > 100) {
    errors.push("Name cannot exceed 100 characters");
  }

  if (!email) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }
  }

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (phone) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      errors.push("Phone number must be exactly 10 digits");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

/**
 * Validate login
 */
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email) {
    errors.push("Email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

/**
 * Validate MongoDB ObjectId
 */
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "ID parameter is required",
    });
  }

  // MongoDB ObjectId is 24 character hex string
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  next();
};

/**
 * Validate status update
 */
exports.validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;

  const validStatuses = [
    "Pending",
    "In Progress",
    "Resolved",
    "Rejected",
    "Closed",
  ];

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  next();
};

/**
 * Validate priority
 */
exports.validatePriority = (req, res, next) => {
  const { priority } = req.body;

  const validPriorities = ["Low", "Medium", "High", "Critical"];

  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid priority. Must be one of: ${validPriorities.join(
        ", "
      )}`,
    });
  }

  next();
};

/**
 * Validate password change
 */
exports.validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const errors = [];

  if (!currentPassword) {
    errors.push("Current password is required");
  }

  if (!newPassword) {
    errors.push("New password is required");
  } else if (newPassword.length < 6) {
    errors.push("New password must be at least 6 characters long");
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push("New password must be different from current password");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};
