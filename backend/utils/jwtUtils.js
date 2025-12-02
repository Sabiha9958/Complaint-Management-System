// src/utils/jwtUtils.js
const jwt = require("jsonwebtoken");

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOKEN_CONFIG = {
  ACCESS_TOKEN: {
    EXPIRY: process.env.JWT_EXPIRES_IN || "15m", // short-lived
    SECRET_ENV_KEY: "JWT_SECRET",
  },
  REFRESH_TOKEN: {
    EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || "30d", // 30 days
    SECRET_ENV_KEY: "JWT_REFRESH_SECRET",
  },
  COOKIE: {
    ACCESS_NAME: "access_token",
    REFRESH_NAME: "refresh_token",
    ACCESS_MAX_AGE: 15 * 60 * 1000, // 15 minutes
    REFRESH_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};

const JWT_ISSUER = process.env.JWT_ISSUER || "complaint-management-system";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "cms-users";

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Get JWT secret from environment variables.
 * @param {String} envKey - Environment variable name.
 * @returns {String} Secret value.
 */
const getSecret = (envKey) => {
  const secret = process.env[envKey];
  if (!secret) {
    throw new Error(`❌ Missing ${envKey} environment variable`);
  }
  return secret;
};

/**
 * Map JWT errors to friendly messages.
 * @param {Error} error
 */
const handleVerificationError = (error) => {
  const errorMap = {
    TokenExpiredError: {
      message: "Token has expired. Please log in again.",
      code: "TOKEN_EXPIRED",
      status: 401,
    },
    JsonWebTokenError: {
      message: "Invalid token. Authorization denied.",
      code: "INVALID_TOKEN",
      status: 401,
    },
    NotBeforeError: {
      message: "Token not yet valid.",
      code: "TOKEN_NOT_ACTIVE",
      status: 401,
    },
  };

  const mapped = errorMap[error.name] || {
    message: "Token verification failed.",
    code: "VERIFICATION_FAILED",
    status: 401,
  };

  const customError = new Error(mapped.message);
  customError.code = mapped.code;
  customError.status = mapped.status;
  throw customError;
};

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a signed JWT access token.
 * @param {Object} payload
 * @param {String} [expiresIn]
 */
const generateAccessToken = (
  payload,
  expiresIn = TOKEN_CONFIG.ACCESS_TOKEN.EXPIRY
) => {
  const secret = getSecret(TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV_KEY);

  const tokenPayload = {
    ...payload,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, secret, {
    expiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

/**
 * Generate a signed JWT refresh token.
 * @param {Object} payload
 * @param {String} [expiresIn]
 */
const generateRefreshToken = (
  payload,
  expiresIn = TOKEN_CONFIG.REFRESH_TOKEN.EXPIRY
) => {
  const secret = getSecret(TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV_KEY);

  const tokenPayload = {
    id: payload.id,
    type: "refresh",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, secret, {
    expiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

/**
 * Create access + refresh pair from a user object.
 * @param {Object} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokenPair = (user) => {
  const accessPayload = {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const refreshPayload = { id: user.id || user._id };

  return {
    accessToken: generateAccessToken(accessPayload),
    refreshToken: generateRefreshToken(refreshPayload),
  };
};

// ============================================================================
// TOKEN VERIFICATION
// ============================================================================

/**
 * Generic verification for access or refresh token.
 * @param {String} token
 * @param {Boolean} isRefresh
 */
const verifyToken = (token, isRefresh = false) => {
  if (!token) {
    throw new Error("Token is required for verification");
  }

  const envKey = isRefresh
    ? TOKEN_CONFIG.REFRESH_TOKEN.SECRET_ENV_KEY
    : TOKEN_CONFIG.ACCESS_TOKEN.SECRET_ENV_KEY;

  const secret = getSecret(envKey);

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const expectedType = isRefresh ? "refresh" : "access";
    if (decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected ${expectedType} token`);
    }

    return decoded;
  } catch (error) {
    return handleVerificationError(error);
  }
};

/**
 * Verify access token only.
 * @param {String} token
 */
const verifyAccessToken = (token) => verifyToken(token, false);

/**
 * Verify refresh token only.
 * @param {String} token
 */
const verifyRefreshToken = (token) => verifyToken(token, true);

// ============================================================================
// TOKEN DECODING (NON SECURE)
// ============================================================================

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error("❌ Token decode error:", error.message);
    return null;
  }
};

const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  return decoded?.exp ? new Date(decoded.exp * 1000) : null;
};

const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};

// ============================================================================
// COOKIE MANAGEMENT
// ============================================================================

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  res.cookie(TOKEN_CONFIG.COOKIE.ACCESS_NAME, accessToken, {
    ...baseOptions,
    maxAge: TOKEN_CONFIG.COOKIE.ACCESS_MAX_AGE,
  });

  res.cookie(TOKEN_CONFIG.COOKIE.REFRESH_NAME, refreshToken, {
    ...baseOptions,
    maxAge: TOKEN_CONFIG.COOKIE.REFRESH_MAX_AGE,
  });
};

const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const opts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  res.clearCookie(TOKEN_CONFIG.COOKIE.ACCESS_NAME, opts);
  res.clearCookie(TOKEN_CONFIG.COOKIE.REFRESH_NAME, opts);
};

/**
 * Extract token from Authorization header (Bearer) or cookies.
 * @param {Object} req
 * @param {Boolean} isRefresh
 */
const extractToken = (req, isRefresh = false) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieName = isRefresh
    ? TOKEN_CONFIG.COOKIE.REFRESH_NAME
    : TOKEN_CONFIG.COOKIE.ACCESS_NAME;

  return req.cookies?.[cookieName] || null;
};

// ============================================================================
// HIGH-LEVEL HELPERS (FOR CONTROLLERS)
// ============================================================================

/**
 * Issue tokens, set cookies, and return payload for JSON response.
 * Use this in /auth/login and /auth/refresh so it stays consistent
 * with the frontend (accessToken + refreshToken in body, cookies set).
 */
const issueTokensAndSetCookies = (user, res) => {
  const { accessToken, refreshToken } = generateTokenPair(user);
  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Config
  TOKEN_CONFIG,

  // Generation
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  issueTokensAndSetCookies,

  // Verification
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,

  // Decode / expiry (non-secure)
  decodeToken,
  getTokenExpiration,
  isTokenExpired,

  // Cookies
  setAuthCookies,
  clearAuthCookies,
  extractToken,
};
