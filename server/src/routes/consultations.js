'use strict';
/**
 * /api/consultations — JARVIS health check-ins.
 *  - patients create and read their own consultations
 *  - doctors read a patient's consultations with ?patientId=JS-xxxxx
 * The questionnaire stays frontend-only; the backend stores the structured
 * answers, detected categories, language and the disclaimer that was shown.
 */
const express = require("express");
const db = require("../db");
const { auth, requireRole } = require("../middleware/auth");
const U = require("../util");

const router = express.Router();

/** DB row -> the same entry shape the frontend used to keep in localStorage. */
function shapeConsultation(row) {
  let answers = [], categories = [];
  try { answers = JSON.parse(row.answers || "[]"); } catch (e) { answers = []; }
  try { categories = JSON.parse(row.categories || "[]"); } catch (e) { categories = []; }
  return {
    id: row.code || ("C-" + row.id),
    code: row.code,
    date: U.fmtDate(row.created_at),
    language: row.language,
    concern: row.concern || "",
    answers,
    categories,
    disclaimer: row.disclaimer || null
  };
}

// ---------------------------------------------------------------------- list ---
router.get("/", auth, (req, res) => {
  let patientId;
  if (req.auth.role === "patient") {
    patientId = req.auth.pid;
  } else {
    patientId = String(req.query.patientId || "");
    if (!patientId) return res.status(400).json({ error: "Doctors must pass ?patientId=JS-xxxxx." });
  }
  const rows = db.prepare(
    "SELECT * FROM consultations WHERE patient_id = ? ORDER BY created_at DESC, id DESC LIMIT 100"
  ).all(patientId);
  res.json(rows.map(shapeConsultation));
});

// --------------------------------------------------------------------- create ---
router.post("/", auth, requireRole("patient"), (req, res) => {
  const b = req.body || {};
  const language = typeof b.language === "string" && b.language.length <= 10 ? b.language : "en";
  if (!U.isStr(b.concern, 2000)) return res.status(400).json({ error: "Invalid concern." });
  const isAnswerItem = (a) => (typeof a === "string" ? a.length <= 2000 : U.isStringArray(a, 2000));
  if (!Array.isArray(b.answers) || b.answers.length > 80 || !b.answers.every(isAnswerItem)) {
    return res.status(400).json({ error: "answers must be an array of strings (or arrays of strings)." });
  }
  if (!U.isStringArray(b.categories, 60)) return res.status(400).json({ error: "categories must be an array of strings." });

  const answers = b.answers.map((a) => (Array.isArray(a) ? a : [a]));
  const code = "C-" + Date.now();
  const disclaimer = (typeof b.disclaimer === "string" && b.disclaimer.length <= 500)
    ? b.disclaimer
    : "Frontend prototype — not a medical diagnosis.";

  const info = db.prepare(`INSERT INTO consultations
    (code, patient_id, language, concern, categories, answers, disclaimer)
    VALUES (?,?,?,?,?,?,?)`)
    .run(code, req.auth.pid, language, (b.concern || "").trim() || "Health check",
      JSON.stringify(b.categories || []), JSON.stringify(answers), disclaimer);

  const row = db.prepare("SELECT * FROM consultations WHERE id = ?").get(Number(info.lastInsertRowid));
  U.audit(db, req.auth.sub, "CONSULTATION_CREATE", "consultation", code, req.ip, { language, categories: b.categories || [] });
  res.status(201).json(shapeConsultation(row));
});

module.exports = { router, shapeConsultation };
