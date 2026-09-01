'use strict';
/**
 * JeevanSetu backend + static frontend server.
 *
 *   npm install && npm start     ->  http://localhost:8000
 *
 * Serves:
 *   - the existing frontend (whitelisted files only — .git/, server internals and
 *     uploads are NEVER statically exposed)
 *   - the JSON API under /api
 *
 * Note: CSP is intentionally relaxed because the current frontend uses inline
 * event handlers and CDN assets. Locking down CSP is a listed production TODO.
 */
const path = require("path");
const express = require("express");
const helmet = require("helmet");

const config = require("./src/config");
const db = require("./src/db");
const { seedIfEmpty } = require("./src/seed");
const { rateLimit } = require("./src/middleware/auth");
const U = require("./src/util");

const authRoutes = require("./src/routes/auth");
const { router: patientRoutes } = require("./src/routes/patients");
const { router: consultationRoutes } = require("./src/routes/consultations");
const documentRoutes = require("./src/routes/documents");
const auditRoutes = require("./src/routes/audit");

const seeded = seedIfEmpty(db);

const app = express();
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false, // TODO: strict CSP once inline handlers are removed from the frontend
  crossOriginEmbedderPolicy: false
}));

// Permissive CORS so the frontend can also be served separately during development.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "256kb" }));

// ------------------------------------------------------------------- api ---
app.get("/api/health", (req, res) => res.json({ ok: true, service: "jeevansetu", time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
// Expose the profile endpoints at the cleaner /api/me path as well.
app.use("/api/me", (req, res, next) => { req.url = "/me"; authRoutes(req, res, next); });
app.use("/api/patients", patientRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "Unknown API endpoint." }));

// ------------------------------------------------------------- frontend ---
const ROOT = path.join(__dirname, "..");
const FRONTEND_FILES = [
  "/index.html", "/app.js", "/styles.css", "/api.js",
  "/favicon.svg", "/jarvis-avatar.svg", "/jeevansetu-logo.svg", "/README.md"
];
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
FRONTEND_FILES.forEach((f) => app.get(f, (req, res) => res.sendFile(path.join(ROOT, f))));

// ------------------------------------------------------- error handling ---
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON body." });
  }
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error." });
});

// ------------------------------------------------------------------ boot ---
app.listen(config.port, config.host, () => {
  console.log(`JeevanSetu server ready on http://localhost:${config.port} (${config.env})`);
  if (!seeded) console.log("[db] existing database found at", config.dbPath);
  if (config.jwtSecret.includes("change-me")) {
    console.warn("[warn] Using the default JWT_SECRET — set JWT_SECRET in the environment for anything non-local.");
  }
});

process.on("SIGINT", () => { console.log("\nbye"); process.exit(0); });
