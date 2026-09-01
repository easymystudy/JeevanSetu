# JeevanSetu — SIH Healthcare Prototype (frontend + backend)

A full-stack SIH prototype focused on an Indian patient experience: the original
multilingual, voice-enabled **JARVIS intake frontend**, now backed by a real
**Node.js + SQLite API server** with authentication, patient records,
consultation storage, document uploads and an audit trail.

## Quick start (one command runs everything)

```bash
cd server
npm install
npm start            # -> http://localhost:8000  (frontend + API)
```

> Requires **Node.js 22.13+** (uses the built-in `node:sqlite` module — no
> native compilation, no database server to install).

Open `http://localhost:8000` and log in with a demo account:

| Role | ID | Password |
|---|---|---|
| Doctor | `anil.verma@abha` | `doctor123` |
| Patient | `ravi.kumar@abha` | `patient123` |

The login page shows these hints automatically whenever the backend is reachable.

## What the backend adds

- **Real authentication** — ABHA-address / demo-Aadhaar login, bcrypt-hashed
  passwords, JWT sessions (12 h), registration with an auto-generated
  JeevanSetu ID (`JS-xxxxx`), login rate limiting.
- **Privacy-conscious Aadhaar handling** — a 12-digit Aadhaar is validated and
  then stored **only** as `SHA256(salt + number)` plus the last 4 digits.
- **Patient records in SQLite** — the demo roster (6 patients, visit history,
  documents) is seeded on first boot, so the doctor dashboard looks exactly
  like the old frontend demo, now persisted.
- **JARVIS consultations stored server-side** — language, concern, adaptive
  categories, full answer list and the disclaimer that was shown.
- **Real document uploads** — PDF/PNG/JPG/DOC/DOCX/CSV up to 10 MB via
  `multipart/form-data`, randomised filenames on disk, download only through an
  authenticated endpoint with an ownership check.
- **Audit log** — logins, failed logins, record views, consultation saves and
  document operations are appended to an audit table; every user can inspect
  their own trail (`GET /api/audit/mine`) — the seed of the "consent/audit
  logging" the production checklist calls for.
- **Graceful degradation** — if the server is unreachable, the frontend falls
  back to the original `localStorage` demo mode (open `index.html` directly and
  everything still works, as before).

## API overview

All endpoints are JSON under `/api`. Authenticated calls need
`Authorization: Bearer <token>`.

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/health` | – | availability probe used by the frontend |
| POST | `/api/auth/register` | – | create patient account (+ profile, + token) |
| POST | `/api/auth/check` | – | step 1 of login: does this ID have an account? |
| POST | `/api/auth/login` | – | login, returns JWT + role + profile ids |
| GET | `/api/me` | both | own profile (patient profile / doctor info) |
| PUT | `/api/me` | patient | update own profile |
| GET | `/api/patients?q=` | doctor | roster (search by name / JS-id) |
| GET | `/api/patients/:id` | doctor or self | full record + visits + consultations + documents |
| GET | `/api/consultations` | both | own history; doctors pass `?patientId=` |
| POST | `/api/consultations` | patient | save a JARVIS check-in |
| GET | `/api/documents` | both | own documents; doctors pass `?patientId=` |
| POST | `/api/documents` | both | multipart upload (`files`, + `patientId` for doctors) |
| GET | `/api/documents/:id/file` | owner/doctor | authenticated download |
| DELETE | `/api/documents/:id` | owner/doctor | delete document + stored file |
| GET | `/api/audit/mine` | both | your own access/activity trail |

Run the automated smoke tests against a running server:

```bash
cd server && bash test-api.sh
```

## Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8000` | HTTP port |
| `JWT_SECRET` | dev default ⚠ | token signing — set this outside local dev |
| `AUTH_SALT` | dev default | salt for Aadhaar hashing |
| `DB_PATH` | `server/data/jeevansetu.db` | SQLite file |
| `UPLOAD_DIR` | `server/uploads` | uploaded documents |
| `TOKEN_TTL` | `12h` | session lifetime |

`server/data/` and `server/uploads/` are git-ignored.

## Frontend notes

The frontend is unchanged in spirit: same UI, same 14 languages, same voice
features. A small bridge (`api.js`) detects the backend and routes data through
the API; `app.js` uses it for login/registration, the doctor roster, patient
details, consultation save/history and document upload/listing — with the old
demo behaviour kept as fallback. To point the frontend at a remote API, set
`window.JS_API_BASE = "https://your-host"` before `api.js` loads.

Also fixed while integrating: the questionnaire's choice buttons had a broken
`onclick` quoting bug (double quotes inside a double-quoted HTML attribute),
which made every choice question unanswerable by mouse/touch.

## JARVIS (unchanged from v4)

- Adaptive intake starts with the patient's own current complaint and asks
  targeted follow-ups across 13 Indian-context categories (breathing, chest,
  diabetes, BP, fever/dengue, stomach, headache, kidney, liver, urinary,
  women's health, skin, mental wellbeing) plus broad medical history.
- Emergency red-flag messaging. **JARVIS does not diagnose.**
- Voice output (speech synthesis) and voice input (speech recognition) with
  hands-free mode; text mode always available.

## Languages

English (India), हिन्दी, বাংলা, తెలుగు, मराठी, தமிழ், ગુજરાતી, ಕನ್ನಡ,
മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া, اردو, Hinglish.
Questions fall back safely to Hindi/English where a full translation is not
included.

## Run (offline frontend fallback)

Open `index.html` directly, or:

```bash
python -m http.server 5500   # then open http://localhost:5500
```

For microphone access, use Chrome/Edge on `localhost` or HTTPS and allow
microphone permission.

## Important

This is a PROTOTYPE. Aadhaar/ABHA authentication is simulated, JARVIS is an
intake questionnaire (not a diagnosis engine), and uploaded documents live in a
local folder — not encrypted storage. For a production SIH build you still
need: real identity verification via ABDM/UIDAI gateways, consent management,
encryption at rest, HTTPS everywhere, refresh-token sessions, strict CSP
(the current frontend uses inline handlers), clinically validated triage, and
FHIR/HL7 interoperability.
