# JeevanSetu — SIH Healthcare Frontend

A polished frontend-only prototype based on the supplied healthcare flowchart.

## Features

- Doctor / Patient role selection
- Frontend Aadhaar login simulation
- Doctor dashboard:
  - Serial-numbered patient list
  - Green / red health status flags
  - Search
  - Attention-required patients
  - Patient details and history
  - Reports page
- Patient dashboard:
  - JARVIS-style AI health assistant UI
  - Multi-step symptom questionnaire
  - Consultation save simulation using browser localStorage
  - Consultation history
  - Medical document upload UI
  - Local document metadata storage using localStorage
  - Profile page
- Responsive desktop/tablet/mobile layout
- Bootstrap 5 + Bootstrap Icons
- Very little JavaScript framework overhead: no React required

## Run

Just open `index.html` in a browser.

For the best experience, run a simple local server from this folder:

```bash
python -m http.server 5500
```

Then open:

http://localhost:5500

## Demo login

Select Doctor or Patient and enter any 12-digit number.

Example:

`123456789012`

## Important

This is FRONTEND ONLY.

There is:
- no real Aadhaar authentication,
- no real AI diagnosis,
- no backend API,
- no real database,
- no real medical data processing.

Consultations and uploaded-file metadata are simulated with browser localStorage. Replace those functions with your SIH backend/API later.

## Suggested backend integration points

1. `/auth/aadhaar` — authentication
2. `/doctor/patients` — doctor patient list
3. `/patients/:id/history` — medical history
4. `/consultations` — save JARVIS questionnaire
5. `/documents` — upload medical documents
6. `/documents/:id` — secure document retrieval
7. AI service — symptom/question generation and clinical summarization
