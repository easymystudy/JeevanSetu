'use strict';
/** Bearer-token auth + role guard + simple in-memory rate limiter. */
const jwt = require("jsonwebtoken");
const config = require("../config");

/** Verifies the JWT and attaches `req.auth` = {sub, role, name, pid?, did?}. */
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const m = header.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: "Authentication required. Please log in." });
  try {
    req.auth = jwt.verify(m[1], config.jwtSecret, { issuer: config.jwtIssuer });
  } catch (e) {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Your account is not allowed to do this." });
    }
    next();
  };
}

/** Tiny fixed-window limiter (per IP) for the auth endpoints. Good enough for a demo. */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 40 } = {}) {
  const buckets = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
  }, windowMs).unref();
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.reset) { b = { count: 0, reset: now + windowMs }; buckets.set(key, b); }
    b.count += 1;
    if (b.count > max) {
      res.setHeader("Retry-After", Math.ceil((b.reset - now) / 1000));
      return res.status(429).json({ error: "Too many attempts. Please try again later." });
    }
    next();
  };
}

module.exports = { auth, requireRole, rateLimit };
