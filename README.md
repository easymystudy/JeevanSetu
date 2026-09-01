# JeevanSetu — SIH Healthcare Frontend v4

A frontend-only SIH prototype focused on an Indian patient experience.

## What is improved in v4

### JARVIS
- Adaptive intake starts with the patient's own current complaint.
- Uses symptom categories to ask targeted follow-up questions instead of one fixed questionnaire.
- Covers common Indian health concerns: breathing/cough, chest/heart, diabetes/sugar, BP, fever/dengue/malaria context, stomach/acidity, headache, kidney/urine, liver/jaundice, skin/allergy, menstrual/pregnancy context and mental wellbeing.
- Collects broad medical history: previous diagnoses, hospitalization/surgery, allergies, current medicines, family history, tobacco/gutkha/smoking, lifestyle and recent medical tests.
- Includes basic emergency red-flag messaging for serious symptoms. It does not diagnose.

### Languages
- English (India)
- हिन्दी
- বাংলা
- తెలుగు
- मराठी
- தமிழ்
- ગુજરાતી
- ಕನ್ನಡ
- മലയാളം
- ਪੰਜਾਬੀ
- ଓଡ଼ିଆ
- অসমীয়া
- اردو
- Hinglish

Questions fall back safely to Hindi/English where a full translation is not included in this frontend demo.

### Voice
- JARVIS can speak questions using browser speech synthesis.
- Patient can answer with browser speech recognition.
- Spoken Yes/No and common choice answers are mapped back to the visible choices.
- Text mode remains available at every step.
- Optional Hands-free / Auto-listen mode starts the microphone after JARVIS finishes speaking.
- If speech APIs are unavailable, the UI remains usable in text mode.

### Branding
- Added a real SVG JeevanSetu logo.
- Added `favicon.svg` for browser tabs.
- Added a separate JARVIS avatar SVG used as an image, not a CSS-only icon.

### Documents
- Optional report/prescription/scan upload is offered at the end of the JARVIS interview.
- File metadata is simulated with localStorage for the frontend demo.

## Run

Open `index.html`, or run:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

For microphone access, use Chrome/Edge on `localhost` or HTTPS and allow microphone permission.

## Important

This is FRONTEND ONLY. It does not perform real Aadhaar/ABHA authentication, medical diagnosis, clinical decision-making, backend database operations or secure document storage.

For an SIH production build, connect the UI to secure backend APIs, consent/audit logging, authentication, encrypted health records and a clinically validated AI/triage layer.
