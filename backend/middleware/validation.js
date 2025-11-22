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

  if (!description || description.trim().length < 10) {
    errors.push("Description must be at least 10 characters long");
  }

  if (!category) {
    errors.push("Category is required");
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
  const { name, email, password } = req.body;

  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
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

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  next();
};
