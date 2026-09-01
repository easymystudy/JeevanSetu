'use strict';
/**
 * /api/audit — transparency for patients ("who looked at my record?").
 * The README's production checklist calls for consent/audit logging; this is the
 * seed of that: every auth event, record view, consultation save and document
 * operation is appended to audit_log, and users can read their own trail.
 */
const express = require("express");
const db = require("../db");
const { auth } = require("../middleware/auth");
const U = require("../util");

const router = express.Router();

router.get("/mine", auth, (req, res) => {
  const rows = db.prepare(
    "SELECT action, entity, entity_id, ip, meta, created_at FROM audit_log WHERE user_id = ? ORDER BY id DESC LIMIT 100"
  ).all(req.auth.sub);
  res.json(rows.map((r) => ({
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    ip: r.ip,
    meta: r.meta ? JSON.parse(r.meta) : null,
    date: U.fmtDate(r.created_at)
  })));
});

module.exports = router;
