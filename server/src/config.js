'use strict';
/**
 * JeevanSetu server configuration.
 * Every value can be overridden with an environment variable.
 * NEVER ship production with the default JWT_SECRET / AUTH_SALT.
 */
const path = require("path");

const required = (v, fallback) => (v === undefined || v === "" ? fallback : v);

const config = {
  env: required(process.env.NODE_ENV, "development"),
  port: parseInt(required(process.env.PORT, "8000"), 10),
  host: required(process.env.HOST, "0.0.0.0"),

  // --- secrets -----------------------------------------------------------
  jwtSecret: required(process.env.JWT_SECRET, "jeevansetu-dev-secret-change-me"),
  jwtIssuer: "jeevansetu",
  tokenTtl: required(process.env.TOKEN_TTL, "12h"),
  authSalt: required(process.env.AUTH_SALT, "jeevansetu-demo-hash-salt"),

  // --- storage -----------------------------------------------------------
  dbPath: required(process.env.DB_PATH, path.join(__dirname, "..", "data", "jeevansetu.db")),
  uploadDir: required(process.env.UPLOAD_DIR, path.join(__dirname, "..", "uploads")),

  // --- limits ------------------------------------------------------------
  maxUploadBytes: 10 * 1024 * 1024, // 10 MB per file
  maxFilesPerUpload: 8,
  authRateLimit: { windowMs: 15 * 60 * 1000, max: 40 },

  // Aadhaar is never stored in plain text — only SHA256(salt + number) + last 4 digits.
  allowAadhaarLogin: true
};

module.exports = config;
