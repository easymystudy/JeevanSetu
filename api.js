/**
 * JeevanSetu frontend ↔ backend bridge.
 *
 * Loaded before app.js. Everything talks to this small `Backend` object:
 *  - when the server (server/) is reachable it uses the real REST API + JWT session
 *  - when it is NOT reachable (e.g. index.html opened straight from disk), every
 *    helper returns { ok:false } and app.js keeps its original localStorage demo
 *    behaviour, so the prototype still works fully offline.
 *
 * To point the frontend at a server on another origin, set
 *   window.JS_API_BASE = "https://your-host"   // before this script loads
 */
(function () {
  "use strict";

  const TOKEN_KEY = "js_token";
  const USER_KEY = "js_user";
  const BASE = (window.JS_API_BASE || "") + "/api";

  const Backend = {
    available: null, // tri-state: null = unknown until first ping
    _pingPromise: null,

    get token() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } },
    get user() { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch (e) { return null; } },

    setUser(user, token) {
      try {
        localStorage.setItem(TOKEN_KEY, token || "");
        localStorage.setItem(USER_KEY, JSON.stringify(user || null));
      } catch (e) { /* private mode */ }
    },
    clear() {
      try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch (e) { }
    },

    /** Resolve (once) whether the backend is reachable. */
    ensure() {
      if (this._pingPromise) return this._pingPromise;
      this._pingPromise = fetch(BASE + "/health", { cache: "no-store" })
        .then((r) => { this.available = r.ok; if (r.ok) this.onReady(); return this.available; })
        .catch(() => { this.available = false; return false; });
      return this._pingPromise;
    },

    /** Runs once when the backend answers for the first time. */
    onReady() {
      if (!this.token) {
        const hint = document.querySelector("#authHint");
        if (hint) {
          hint.innerHTML = "Backend connected. Demo logins — <strong>anil.verma@abha / doctor123</strong> (doctor) or " +
            "<strong>ravi.kumar@abha / patient123</strong> (patient). No real Aadhaar data is processed.";
        }
      }
    },

    /**
     * Minimal REST helper. Returns { ok, status, data } and never throws —
     * callers can always fall back to demo behaviour.
     *   Backend.req("/consultations")                                  → GET
     *   Backend.req("/consultations", {method:"POST", body:{...}})     → JSON
     *   Backend.req("/documents", {method:"POST", form:formData})      → multipart
     */
    async req(path, opts) {
      const o = opts || {};
      const headers = {};
      if (this.token) headers["Authorization"] = "Bearer " + this.token;
      if (o.body !== undefined) headers["Content-Type"] = "application/json";
      try {
        const res = await fetch(BASE + path, {
          method: o.method || "GET",
          headers,
          body: o.body !== undefined ? JSON.stringify(o.body) : o.form || undefined
        });
        let data = null;
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) { try { data = await res.json(); } catch (e) { data = null; } }
        if (res.status === 401 && !path.startsWith("/auth/")) this.clear(); // stale session
        return { ok: res.ok, status: res.status, data };
      } catch (e) {
        this.available = false;
        this._pingPromise = null;
        return { ok: false, status: 0, data: null };
      }
    },

    // ------------------------------------------------------------- helpers ---
    async checkIdentifier(identifier, identifierType) {
      const r = await this.req("/auth/check", { method: "POST", body: { identifier, identifierType } });
      return r.ok && r.data ? r.data : null;
    },
    async login(identifier, password, identifierType) {
      const r = await this.req("/auth/login", { method: "POST", body: { identifier, password, identifierType } });
      if (r.ok && r.data && r.data.token) this.setUser(r.data.user, r.data.token);
      return r;
    },
    async register(payload) {
      return this.req("/auth/register", { method: "POST", body: payload });
    },
    async me() { return this.req("/me"); },
    async updateProfile(patch) { return this.req("/me", { method: "PUT", body: patch }); },
    async listPatients(q) { return this.req("/patients" + (q ? "?q=" + encodeURIComponent(q) : "")); },
    async patientDetail(id) { return this.req("/patients/" + encodeURIComponent(id)); },
    async listConsultations() { return this.req("/consultations"); },
    async saveConsultation(entry) {
      return this.req("/consultations", {
        method: "POST",
        body: {
          language: entry.language, concern: entry.concern, answers: entry.answers,
          categories: entry.categories || [], disclaimer: entry.disclaimer
        }
      });
    },
    async listDocuments() { return this.req("/documents"); },
    async uploadFiles(files) {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      return this.req("/documents", { method: "POST", form: fd });
    }
  };

  window.Backend = Backend;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => Backend.ensure());
  } else {
    Backend.ensure();
  }
})();
