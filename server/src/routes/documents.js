'use strict';
/**
 * /api/documents — real file uploads (reports / prescriptions / scans).
 *  - multer writes to server/uploads with a randomised name (original name kept in DB)
 *  - extension + size whitelist; files are only served through the authenticated
 *    download endpoint with an ownership check (never statically exposed)
 *  - patients see/upload their own files; doctors pass ?patientId= / patientId field
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const config = require("../config");
const db = require("../db");
const { transaction } = require("../db");
const { auth } = require("../middleware/auth");
const U = require("../util");
const { fileKind } = require("./patients");

const router = express.Router();

const ALLOWED = /\.(pdf|png|jpe?g|gif|webp|docx?|csv)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + crypto.randomBytes(8).toString("hex") + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: config.maxFilesPerUpload },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.test(file.originalname)) return cb(new Error("INVALID_TYPE"));
    cb(null, true);
  }
});

function shapeDoc(d) {
  return {
    id: d.id,
    name: d.name,
    type: fileKind(d.name),
    size: U.fmtSize(d.size_bytes),
    date: U.isToday(d.uploaded_at) ? "Just now" : U.fmtDate(d.uploaded_at),
    hasFile: !!d.stored_name
  };
}

function resolvePatientId(req) {
  if (req.auth.role === "patient") return req.auth.pid; // patients are pinned to themselves
  const pid = String(req.query.patientId || (req.body && req.body.patientId) || "");
  if (!pid) return null;
  return pid;
}

// ----------------------------------------------------------------------- list ---
router.get("/", auth, (req, res) => {
  const patientId = resolvePatientId(req);
  if (!patientId) return res.status(400).json({ error: "Doctors must pass ?patientId=JS-xxxxx." });
  if (req.auth.role === "doctor") {
    const exists = db.prepare("SELECT 1 FROM patients WHERE id = ?").get(patientId);
    if (!exists) return res.status(404).json({ error: "Patient not found." });
  }
  const rows = db.prepare(
    "SELECT * FROM documents WHERE patient_id = ? ORDER BY uploaded_at DESC, id DESC LIMIT 200").all(patientId);
  res.json(rows.map(shapeDoc));
});

// --------------------------------------------------------------------- upload ---
router.post("/", auth, upload.array("files", config.maxFilesPerUpload), (req, res, next) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: "No files received. Attach at least one file." });

  const patientId = resolvePatientId(req);
  if (!patientId) {
    files.forEach((f) => fs.unlink(f.path, () => {}));
    return res.status(400).json({ error: "Doctors must send patientId to upload on behalf of a patient." });
  }
  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(patientId);
  if (!patient) {
    files.forEach((f) => fs.unlink(f.path, () => {}));
    return res.status(404).json({ error: "Patient not found." });
  }

  const insert = db.prepare(
    "INSERT INTO documents (patient_id, uploader_user_id, name, stored_name, mime, size_bytes) VALUES (?,?,?,?,?,?)");
  const created = transaction(() => files.map((f) => {
    const info = insert.run(patientId, req.auth.sub, Buffer.from(f.originalname, "latin1").toString("utf8"), f.filename, f.mimetype, f.size);
    return db.prepare("SELECT * FROM documents WHERE id = ?").get(Number(info.lastInsertRowid));
  }))();

  U.audit(db, req.auth.sub, "DOC_UPLOAD", "document", created.map((c) => c.id).join(","), req.ip,
    { patientId, count: created.length, names: created.map((c) => c.name).slice(0, 8) });
  res.status(201).json(created.map(shapeDoc));
});

// -------------------------------------------------------------------- download ---
router.get("/:id/file", auth, (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(Number(req.params.id) || 0);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  if (req.auth.role === "patient" && req.auth.pid !== doc.patient_id) {
    return res.status(403).json({ error: "This document belongs to another patient." });
  }
  if (!doc.stored_name) {
    return res.status(404).json({ error: "This is a seeded demo document — no stored file exists." });
  }
  const filePath = path.join(config.uploadDir, doc.stored_name);
  if (!fs.existsSync(filePath)) return res.status(410).json({ error: "Stored file is missing." });

  U.audit(db, req.auth.sub, "DOC_DOWNLOAD", "document", doc.id, req.ip, { patientId: doc.patient_id });
  res.setHeader("Content-Disposition", `attachment; filename="${doc.name.replace(/"/g, "")}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(filePath);
});

// ---------------------------------------------------------------------- delete ---
router.delete("/:id", auth, (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(Number(req.params.id) || 0);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  if (req.auth.role === "patient" && req.auth.pid !== doc.patient_id) {
    return res.status(403).json({ error: "This document belongs to another patient." });
  }
  if (doc.stored_name) {
    const filePath = path.join(config.uploadDir, doc.stored_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare("DELETE FROM documents WHERE id = ?").run(doc.id);
  U.audit(db, req.auth.sub, "DOC_DELETE", "document", doc.id, req.ip, { patientId: doc.patient_id, name: doc.name });
  res.json({ ok: true });
});

/** Multer-specific error mapping. */
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? `Each file must be under ${config.maxUploadBytes / (1024 * 1024)} MB.`
      : `Upload error: ${err.code}`;
    return res.status(413).json({ error: msg });
  }
  if (err && err.message === "INVALID_TYPE") {
    return res.status(400).json({ error: "Unsupported file type. Allowed: PDF, PNG, JPG, GIF, WEBP, DOC, DOCX, CSV." });
  }
  next(err);
});

module.exports = router;
