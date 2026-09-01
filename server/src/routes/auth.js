'use strict';
/**
 * /api/auth — register, identifier check (step 1 of the login UI), login, profile.
 * Security notes:
 *  - passwords: bcrypt (cost 10), never stored or logged in plain text
 *  - Aadhaar: validated as 12 digits, then ONLY sha256(salt+n) + last4 are stored
 *  - identifiers are normalised/lowercased; lookups are parameterised
 *  - every auth event is written to the audit log
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../db");
const { transaction } = require("../db");
const { auth, requireRole, rateLimit } = require("../middleware/auth");
const U = require("../util");

const router = express.Router();

function signToken(user) {
  const payload = { sub: user.id, role: user.role, name: user.name };
  if (user.role === "patient") payload.pid = user.patientId;
  if (user.role === "doctor") payload.did = user.doctorId;
  return jwt.sign(payload, config.jwtSecret, { issuer: config.jwtIssuer, expiresIn: config.tokenTtl });
}

/** Normalise an incoming identifier and resolve it to a user row (or null). */
function resolveIdentifier(identifier, identifierType) {
  const id = String(identifier || "").trim();
  let type = identifierType;
  if (!type) type = U.isAadhaar(id) ? "aadhaar" : "abha";
  if (type === "aadhaar") {
    if (!U.isAadhaar(id)) return { error: "Aadhaar must be exactly 12 digits." };
    return { type, stored: U.sha256(id), last4: id.slice(-4) };
  }
  if (!U.isAbha(id)) return { error: "Enter a valid ABHA Address (e.g. ravi.kumar@abha)." };
  return { type, stored: id.toLowerCase(), last4: null };
}

function publicUser(u) {
  return {
    id: u.role === "patient" ? u.patientId : u.doctorId,
    role: u.role,
    name: u.name,
    identifierType: u.identifier_type,
    identifierLast4: u.identifier_last4
  };
}

// ----------------------------------------------------------------- register ---
router.post("/register", rateLimit(config.authRateLimit), (req, res) => {
  const b = req.body || {};
  const method = b.identityMethod === "abha" ? "abha" : b.identityMethod === "aadhaar" ? "aadhaar" : null;
  if (!method) return res.status(400).json({ error: "identityMethod must be 'aadhaar' or 'abha'." });
  if (!U.isNonEmpty(b.name, 80)) return res.status(400).json({ error: "Please enter your full name." });
  if (!U.isAge(b.age) && !b.dob) return res.status(400).json({ error: "Please provide date of birth or age." });

  const resolved = resolveIdentifier(b.identity, method);
  if (resolved.error) return res.status(400).json({ error: resolved.error });
  if (typeof b.password !== "string" || b.password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (!/^\d{10}$/.test(String(b.mobile || "").replace(/\D/g, ""))) {
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number." });
  }

  const exists = db.prepare("SELECT 1 FROM users WHERE identifier = ?").get(resolved.stored);
  if (exists) return res.status(409).json({ error: "An account with this ID already exists. Please log in." });

  const age = b.dob ? U.computeAgeFromDob(b.dob) : (b.age ? parseInt(b.age, 10) : null);
  const patientId = U.newPatientId(db);

  const tx = transaction(() => {
    const info = db.prepare(
      "INSERT INTO users (role, identifier_type, identifier, identifier_last4, password_hash, name) VALUES ('patient',?,?,?,?,?)"
    ).run(resolved.type, resolved.stored, resolved.last4, bcrypt.hashSync(b.password, 10), b.name.trim());
    const userId = Number(info.lastInsertRowid);
    db.prepare(`INSERT INTO patients
      (id, user_id, name, age, gender, blood_group, phone, location, height_cm, weight_kg,
       allergies, chronic_conditions, current_meds, emergency_contact, status, primary_doctor_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'None',?,'stable','DOC-001')`)
      .run(patientId, userId, b.name.trim(), age,
        U.isStr(b.gender, 20) ? (b.gender || null) : null,
        U.isStr(b.blood, 8) ? (b.blood || null) : null,
        U.isStr(b.mobile, 15) ? String(b.mobile).replace(/\D/g, "") : null,
        U.isStr(b.location, 100) ? (b.location || null) : null,
        U.isStr(b.height, 10) ? (b.height || null) : null,
        U.isStr(b.weight, 10) ? (b.weight || null) : null,
        U.isStr(b.allergies, 300) ? (b.allergies || "None") : "None",
        U.isStr(b.conditions, 300) ? (b.conditions || "None") : "None",
        U.isStr(b.emergency, 40) ? (b.emergency || null) : null);
    return userId;
  });
  const userId = tx();

  U.audit(db, userId, "AUTH_REGISTER", "patient", patientId, req.ip, { method: resolved.type });
  const user = { id: userId, role: "patient", name: b.name.trim(), patientId, identifier_type: resolved.type, identifier_last4: resolved.last4 };
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// ------------------------------------------------- identifier check (step 1) ---
router.post("/check", rateLimit(config.authRateLimit), (req, res) => {
  const resolved = resolveIdentifier(req.body && req.body.identifier, req.body && req.body.identifierType);
  if (resolved.error) return res.status(400).json({ error: resolved.error });
  const row = db.prepare("SELECT 1 FROM users WHERE identifier = ?").get(resolved.stored);
  res.json({ exists: !!row, identifierType: resolved.type });
});

// --------------------------------------------------------------------- login ---
router.post("/login", rateLimit(config.authRateLimit), (req, res) => {
  const b = req.body || {};
  const resolved = resolveIdentifier(b.identifier, b.identifierType);
  if (resolved.error) return res.status(400).json({ error: resolved.error });
  if (!b.password) return res.status(400).json({ error: "Enter your password." });

  const row = db.prepare(`
    SELECT u.id, u.role, u.name, u.identifier_type, u.identifier_last4, u.password_hash,
           p.id AS patientId, d.id AS doctorId
    FROM users u
    LEFT JOIN patients p ON p.user_id = u.id
    LEFT JOIN doctors  d ON d.user_id = u.id
    WHERE u.identifier = ?`).get(resolved.stored);

  if (!row || !bcrypt.compareSync(String(b.password), row.password_hash)) {
    U.audit(db, row ? row.id : null, "AUTH_LOGIN_FAIL", resolved.type, resolved.last4 ? "aadhaar-••••" + resolved.last4 : b.identifier, req.ip);
    return res.status(401).json({ error: "Incorrect ID or password. Please try again." });
  }

  U.audit(db, row.id, "AUTH_LOGIN", row.role, row.patientId || row.doctorId, req.ip);
  res.json({ token: signToken(row), user: publicUser(row) });
});

// ----------------------------------------------------------------------- me ---
router.get("/me", auth, (req, res) => {
  if (req.auth.role === "doctor") {
    const d = db.prepare("SELECT id, name, specialty, registration_no FROM doctors WHERE id = ?").get(req.auth.did);
    if (!d) return res.status(404).json({ error: "Doctor profile not found." });
    return res.json({ role: "doctor", user: { id: d.id, name: d.name, specialty: d.specialty, registrationNo: d.registration_no } });
  }
  const p = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.auth.pid);
  if (!p) return res.status(404).json({ error: "Patient profile not found." });
  res.json({
    role: "patient",
    user: {
      id: p.id, name: p.name, role: "patient",
      profile: {
        id: p.id, name: p.name, age: p.age, gender: p.gender, blood_group: p.blood_group,
        phone: p.phone, location: p.location, height_cm: p.height_cm, weight_kg: p.weight_kg,
        allergies: p.allergies, chronic_conditions: p.chronic_conditions,
        current_meds: p.current_meds, emergency_contact: p.emergency_contact, status: p.status
      }
    }
  });
});

const UPDATABLE = ["name", "age", "gender", "blood_group", "phone", "location", "height_cm", "weight_kg", "allergies", "chronic_conditions", "current_meds", "emergency_contact"];
router.put("/me", auth, requireRole("patient"), (req, res) => {
  const b = req.body || {};
  const updates = [];
  const values = [];
  for (const key of UPDATABLE) {
    if (b[key] === undefined) continue;
    if (key === "name" && !U.isNonEmpty(b.name, 80)) return res.status(400).json({ error: "Name cannot be empty." });
    if (key === "age" && !U.isAge(b.age)) return res.status(400).json({ error: "Age must be a number between 0 and 130." });
    if (key !== "age" && !U.isStr(b[key], 300)) return res.status(400).json({ error: `Invalid value for ${key}.` });
    updates.push(`${key} = ?`);
    values.push(b[key] === null ? null : (key === "age" ? parseInt(b.age, 10) : String(b[key])));
  }
  if (!updates.length) return res.status(400).json({ error: "Nothing to update." });

  updates.push("updated_at = datetime('now')");
  values.push(req.auth.pid);
  db.prepare(`UPDATE patients SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  U.audit(db, req.auth.sub, "PROFILE_UPDATE", "patient", req.auth.pid, req.ip, { fields: updates.map((u) => u.split(" ")[0]) });

  const p = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.auth.pid);
  res.json({
    ok: true,
    user: {
      id: p.id, role: "patient", name: p.name,
      profile: {
        id: p.id, name: p.name, age: p.age, gender: p.gender, blood_group: p.blood_group,
        phone: p.phone, location: p.location, allergies: p.allergies,
        chronic_conditions: p.chronic_conditions, current_meds: p.current_meds,
        emergency_contact: p.emergency_contact, status: p.status
      }
    }
  });
});

module.exports = router;
