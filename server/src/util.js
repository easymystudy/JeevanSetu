'use strict';
/** Small shared helpers: validation, formatting, ids, audit. */
const crypto = require("crypto");
const config = require("./config");

// ---------------------------------------------------------------- dates ---
const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** "2026-05-12 10:00:00" (UTC) -> "12 May 2026", matching the frontend's format. */
function fmtDate(sqlDateTime) {
  if (!sqlDateTime) return "";
  const s = String(sqlDateTime);
  const d = new Date(s.includes("T") || s.endsWith("Z") ? s : s.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return s;
  return DATE_FMT.format(d);
}

function isToday(sqlDateTime) {
  if (!sqlDateTime) return false;
  const d = new Date(String(sqlDateTime).replace(" ", "T") + "Z");
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth() && d.getUTCDate() === now.getUTCDate();
}

/** 1258291 -> "1.2 MB" (the shape the frontend already renders). */
function fmtSize(bytes) {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ------------------------------------------------------------ identifiers ---
function sha256(value) {
  return crypto.createHash("sha256").update(config.authSalt + String(value)).digest("hex");
}

function initials(name) {
  return String(name || "").trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "JS";
}

/** Unique patient id "JS-00124" style (5 digits). */
function newPatientId(db) {
  for (let i = 0; i < 1000; i++) {
    const id = "JS-" + String(Math.floor(10000 + Math.random() * 89999));
    const row = db.prepare("SELECT 1 FROM patients WHERE id = ?").get(id);
    if (!row) return id;
  }
  return "JS-" + Date.now().toString().slice(-5);
}

// ------------------------------------------------------------ validation ---
function isAadhaar(v) { return typeof v === "string" && /^\d{12}$/.test(v); }
function isAbha(v) { return typeof v === "string" && /^[A-Za-z0-9._-]{2,64}(@[A-Za-z0-9.-]{2,32})?$/.test(v); }
function isNonEmpty(v, max = 200) { return typeof v === "string" && v.trim().length > 0 && v.trim().length <= max; }
function isStr(v, max = 200) { return v === undefined || v === null || (typeof v === "string" && v.length <= max); }
function isAge(v) { return v === undefined || v === null || v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 130); }
function isStringArray(v, maxLen = 2000) {
  return Array.isArray(v) && v.every((x) => typeof x === "string" && x.length <= maxLen);
}
function strArrayWithin(v, maxItems = 80) { return Array.isArray(v) && v.length <= maxItems; }

function computeAgeFromDob(dob) {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const d = new Date(dob + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return Math.max(0, Math.min(130, age));
}

// ---------------------------------------------------------------- audit ---
/** Append-only audit trail (WHO did WHAT to WHICH record, WHEN, from WHERE). */
function audit(db, userId, action, entity, entityId, ip, meta) {
  try {
    db.prepare(
      "INSERT INTO audit_log (user_id, action, entity, entity_id, ip, meta) VALUES (?,?,?,?,?,?)"
    ).run(userId ?? null, action, entity ?? null, entityId != null ? String(entityId) : null, ip ?? null,
      meta ? JSON.stringify(meta).slice(0, 2000) : null);
  } catch (e) {
    console.error("audit write failed:", e.message);
  }
}

/** Wrap async route handlers so rejected promises reach the error middleware. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = {
  fmtDate, fmtSize, isToday, sha256, initials, newPatientId, audit, asyncHandler,
  isAadhaar, isAbha, isNonEmpty, isStr, isAge, isStringArray, strArrayWithin, computeAgeFromDob
};
