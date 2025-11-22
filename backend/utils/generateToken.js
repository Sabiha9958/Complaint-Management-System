/**
 * JWT Token Generator Utility
 * Creates JWT tokens for authentication
 */

const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} - Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

module.exports = generateToken;
