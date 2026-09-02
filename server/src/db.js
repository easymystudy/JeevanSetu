'use strict';
/**
 * Database layer — SQLite via node:sqlite (built into Node >= 22.13, no native deps).
 * Schema is created idempotently on boot; demo data is seeded once (see seed.js).
 */
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const config = require("./config");

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
fs.mkdirSync(config.uploadDir, { recursive: true });

const db = new DatabaseSync(config.dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  role             TEXT    NOT NULL CHECK (role IN ('doctor','patient')),
  identifier_type  TEXT    NOT NULL CHECK (identifier_type IN ('aadhaar','abha')),
  identifier       TEXT    NOT NULL UNIQUE,          -- abha address (lowercase) or SHA256(salt+aadhaar)
  identifier_last4 TEXT,                              -- only ever the last 4 digits, for display
  password_hash    TEXT    NOT NULL,
  name             TEXT    NOT NULL,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctors (
  id              TEXT PRIMARY KEY,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id),
  name            TEXT NOT NULL,
  specialty       TEXT,
  registration_no TEXT
);

CREATE TABLE IF NOT EXISTS patients (
  id                  TEXT PRIMARY KEY,              -- "JS-00124"
  user_id             INTEGER UNIQUE REFERENCES users(id),
  name                TEXT NOT NULL,
  age                 INTEGER,
  gender              TEXT,
  blood_group         TEXT,
  phone               TEXT,
  location            TEXT,
  height_cm           TEXT,
  weight_kg           TEXT,
  allergies           TEXT DEFAULT 'None',
  chronic_conditions  TEXT DEFAULT 'None',           -- shown as "condition" in the doctor table
  current_meds        TEXT DEFAULT 'None',
  emergency_contact   TEXT,
  status              TEXT NOT NULL DEFAULT 'stable' CHECK (status IN ('stable','attention')),
  primary_doctor_id   TEXT REFERENCES doctors(id),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id  TEXT NOT NULL REFERENCES patients(id),
  doctor_id   TEXT REFERENCES doctors(id),
  visit_date  TEXT NOT NULL,                         -- display date, e.g. "12 May 2026"
  reason      TEXT NOT NULL,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);

CREATE TABLE IF NOT EXISTS consultations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT UNIQUE,                           -- "C-1756..." shown in the UI
  patient_id  TEXT NOT NULL REFERENCES patients(id),
  language    TEXT DEFAULT 'en',
  concern     TEXT,
  categories  TEXT DEFAULT '[]',                     -- JSON array of adaptive categories
  answers     TEXT NOT NULL DEFAULT '[]',            -- JSON array of answers (strings / arrays)
  disclaimer  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_consult_patient ON consultations(patient_id);

CREATE TABLE IF NOT EXISTS documents (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id       TEXT NOT NULL REFERENCES patients(id),
  uploader_user_id INTEGER REFERENCES users(id),
  name             TEXT NOT NULL,                    -- original filename
  stored_name      TEXT,                             -- file on disk (NULL = seeded demo row)
  mime             TEXT,
  size_bytes       INTEGER,
  uploaded_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_docs_patient ON documents(patient_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  ip         TEXT,
  meta       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
`);

/** better-sqlite3-style transaction wrapper (node:sqlite has no built-in one). */
function transaction(fn) {
  return (...args) => {
    db.exec("BEGIN");
    try {
      const result = fn(...args);
      db.exec("COMMIT");
      return result;
    } catch (e) {
      try { db.exec("ROLLBACK"); } catch (_) { /* already rolled back */ }
      throw e;
    }
  };
}

module.exports = db;
module.exports.transaction = transaction;
