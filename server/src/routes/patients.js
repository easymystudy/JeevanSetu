'use strict';
/**
 * /api/patients — the doctor's roster + full patient records.
 * Doctors can read every record; patients can only ever read their own.
 * Every doctor access to a patient record is audit-logged.
 */
const express = require("express");
const db = require("../db");
const { auth, requireRole } = require("../middleware/auth");
const U = require("../util");
const { shapeConsultation } = require("./consultations");

const router = express.Router();

const PATIENT_SELECT = `
  SELECT p.*, d.name AS doctor_name,
         (SELECT MAX(v.visit_date) FROM visits v WHERE v.patient_id = p.id) AS last_visit
  FROM patients p
  LEFT JOIN doctors d ON d.id = p.primary_doctor_id`;

function visitsFor(patientId) {
  return db.prepare(`
    SELECT v.visit_date, v.reason, v.notes, COALESCE(d.name, '') AS doctor_name
    FROM visits v LEFT JOIN doctors d ON d.id = v.doctor_id
    WHERE v.patient_id = ? ORDER BY v.visit_date DESC, v.id DESC`).all(patientId);
}

/** Shape a DB row into exactly the object the frontend's `patients` array uses. */
function shapePatient(row, { includePrivate = false } = {}) {
  const history = visitsFor(row.id).map((v) => [v.visit_date, v.reason, v.notes || "", v.doctor_name || ""]);
  const base = {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender || "",
    visit: row.last_visit || "—",
    condition: row.chronic_conditions || "None",
    status: row.status,
    blood: row.blood_group || "—",
    initials: U.initials(row.name),
    allergies: row.allergies || "None",
    meds: row.current_meds || "None",
    history
  };
  if (includePrivate) {
    base.phone = row.phone;
    base.location = row.location;
    base.height = row.height_cm;
    base.weight = row.weight_kg;
    base.emergency = row.emergency_contact;
    base.doctor = row.doctor_name;
  }
  return base;
}

// -------------------------------------------------------------- list (doctor) ---
router.get("/", auth, requireRole("doctor"), (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  let rows = db.prepare(`${PATIENT_SELECT} ORDER BY p.id`).all();
  if (q) rows = rows.filter((r) => `${r.name} ${r.id}`.toLowerCase().includes(q));
  res.json(rows.map((r) => shapePatient(r)));
});

// ---------------------------------------------------- detail (doctor or self) ---
router.get("/:id", auth, (req, res) => {
  const id = String(req.params.id || "");
  if (req.auth.role === "patient" && req.auth.pid !== id) {
    return res.status(403).json({ error: "You can only view your own record." });
  }
  const row = db.prepare(`${PATIENT_SELECT} WHERE p.id = ?`).get(id);
  if (!row) return res.status(404).json({ error: "Patient not found." });

  if (req.auth.role === "doctor") {
    U.audit(db, req.auth.sub, "PATIENT_VIEW", "patient", id, req.ip, { by: "doctor" });
  }

  const consultations = db.prepare(
    "SELECT * FROM consultations WHERE patient_id = ? ORDER BY created_at DESC, id DESC LIMIT 50").all(id)
    .map(shapeConsultation);
  const documents = db.prepare(
    "SELECT * FROM documents WHERE patient_id = ? ORDER BY uploaded_at DESC, id DESC LIMIT 100").all(id)
    .map((d) => ({
      id: d.id, name: d.name, type: fileKind(d.name), size: U.fmtSize(d.size_bytes),
      date: U.isToday(d.uploaded_at) ? "Just now" : U.fmtDate(d.uploaded_at), hasFile: !!d.stored_name
    }));

  res.json({ patient: shapePatient(row, { includePrivate: true }), consultations, documents });
});

function fileKind(name) {
  const n = String(name || "").toLowerCase();
  if (/\.(png|jpe?g|gif|webp)$/.test(n)) return "image";
  if (/\.docx?$/.test(n)) return "doc";
  return "pdf";
}

module.exports = { router, shapePatient, fileKind };
