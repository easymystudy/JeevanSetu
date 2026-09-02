'use strict';
/**
 * Demo seed data — mirrors the patients array that previously lived in app.js,
 * so the doctor dashboard looks identical after switching to the backend.
 * Runs only when the users table is empty.
 */
const bcrypt = require("bcryptjs");
const { transaction } = require("./db");
const { sha256, initials } = require("./util");

const SEED_PATIENTS = [
  { id: "JS-00124", name: "Ravi Kumar", age: 45, gender: "Male", visit: "12 May 2026", condition: "Hypertension", status: "stable", blood: "B+", allergies: "None", meds: "Amlodipine 5mg", phone: "9876543210", location: "New Delhi", height: "170", weight: "78", emergency: "+91 98765 00001", history: [
    ["12 May 2026", "BP high", "Prescribed Amlodipine 5mg", "Dr. Anil Verma"],
    ["10 Apr 2026", "Routine checkup", "Vitals reviewed; stable", "Dr. Anil Verma"],
    ["05 Mar 2026", "Fever / cold", "Prescribed Paracetamol", "Dr. Anil Verma"]
  ] },
  { id: "JS-00131", name: "Sneha Sharma", age: 32, gender: "Female", visit: "10 May 2026", condition: "Diabetes — controlled", status: "stable", blood: "O+", allergies: "Penicillin", meds: "Metformin 500mg", phone: "9812345670", location: "Gurugram", height: "162", weight: "61", emergency: "+91 98123 00002", history: [
    ["10 May 2026", "Diabetes review", "HbA1c reviewed; controlled", "Dr. Anil Verma"],
    ["12 Mar 2026", "Routine checkup", "Medication continued", "Dr. Anil Verma"]
  ] },
  { id: "JS-00142", name: "Amit Singh", age: 50, gender: "Male", visit: "09 May 2026", condition: "High BP", status: "attention", blood: "A+", allergies: "None", meds: "Losartan 50mg", phone: "9832109876", location: "Noida", height: "175", weight: "84", emergency: "+91 98321 00003", history: [
    ["09 May 2026", "Elevated BP", "Follow-up advised in 7 days", "Dr. Anil Verma"],
    ["11 Apr 2026", "Routine checkup", "BP monitoring advised", "Dr. Anil Verma"]
  ] },
  { id: "JS-00157", name: "Pooja Verma", age: 28, gender: "Female", visit: "08 May 2026", condition: "Healthy", status: "stable", blood: "AB+", allergies: "None", meds: "None", phone: "9765432109", location: "New Delhi", height: "158", weight: "55", emergency: "+91 97654 00004", history: [
    ["08 May 2026", "Annual checkup", "No concerns found", "Dr. Anil Verma"]
  ] },
  { id: "JS-00168", name: "Mohit Joshi", age: 60, gender: "Male", visit: "07 May 2026", condition: "Diabetes", status: "attention", blood: "B-", allergies: "None", meds: "Metformin 500mg", phone: "9753108642", location: "Faridabad", height: "168", weight: "80", emergency: "+91 97531 00005", history: [
    ["07 May 2026", "Blood sugar high", "Diet + medication review", "Dr. Anil Verma"],
    ["04 Apr 2026", "Diabetes follow-up", "Medication adjusted", "Dr. Anil Verma"]
  ] },
  { id: "JS-00176", name: "Neha Gupta", age: 39, gender: "Female", visit: "06 May 2026", condition: "Thyroid", status: "stable", blood: "A+", allergies: "None", meds: "Levothyroxine", phone: "9740098765", location: "New Delhi", height: "160", weight: "64", emergency: "+91 97400 00006", history: [
    ["06 May 2026", "Thyroid review", "TSH within target", "Dr. Anil Verma"]
  ] }
];

/** Seeded demo documents (metadata only — no stored file, preview intentionally unavailable). */
const SEED_DOCUMENTS = [
  { patient: "JS-00124", name: "Blood Report.pdf", size: 1258291, at: "2026-05-10 09:15:00" },
  { patient: "JS-00124", name: "X-Ray Chest.png", size: 2621440, at: "2026-05-08 14:40:00" },
  { patient: "JS-00124", name: "Prescription.docx", size: 819200, at: "2026-05-05 11:05:00" },
  { patient: "JS-00124", name: "ECG Report.pdf", size: 1572864, at: "2026-05-01 16:30:00" }
];

const SEED_CONSULTATION = {
  patient: "JS-00124",
  language: "en",
  concern: "Routine health check",
  categories: [],
  answers: ["Routine health check completed", "More than a week ago", "Mild"],
  at: "2026-05-12 10:00:00"
};

function seedIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) return false;

  const insertUser = db.prepare(
    "INSERT INTO users (role, identifier_type, identifier, identifier_last4, password_hash, name) VALUES (?,?,?,?,?,?)"
  );
  const insertDoctor = db.prepare(
    "INSERT INTO doctors (id, user_id, name, specialty, registration_no) VALUES (?,?,?,?,?)"
  );
  const insertPatient = db.prepare(`INSERT INTO patients
    (id, user_id, name, age, gender, blood_group, phone, location, height_cm, weight_kg,
     allergies, chronic_conditions, current_meds, emergency_contact, status, primary_doctor_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertVisit = db.prepare(
    "INSERT INTO visits (patient_id, doctor_id, visit_date, reason, notes) VALUES (?,?,?,?,?)"
  );
  const insertDoc = db.prepare(
    "INSERT INTO documents (patient_id, name, stored_name, mime, size_bytes, uploaded_at) VALUES (?,?,NULL,?,?,?)"
  );
  const insertConsult = db.prepare(
    "INSERT INTO consultations (code, patient_id, language, concern, categories, answers, disclaimer, created_at) VALUES (?,?,?,?,?,?,?,?)"
  );

  const seed = transaction(() => {
    // --- doctor account -------------------------------------------------
    const docUser = insertUser.run("doctor", "abha", "anil.verma@abha", null,
      bcrypt.hashSync("doctor123", 10), "Dr. Anil Verma");
    const doctorUserId = Number(docUser.lastInsertRowid);
    insertDoctor.run("DOC-001", doctorUserId, "Dr. Anil Verma", "General Medicine", "DMC-2011-45231");

    // --- demo patient login (Ravi Kumar) --------------------------------
    const ravi = SEED_PATIENTS[0];
    const raviUser = insertUser.run("patient", "abha", "ravi.kumar@abha", null,
      bcrypt.hashSync("patient123", 10), ravi.name);
    const raviUserId = Number(raviUser.lastInsertRowid);

    SEED_PATIENTS.forEach((p, idx) => {
      const userId = idx === 0 ? raviUserId : null; // only Ravi gets a login in the demo
      insertPatient.run(p.id, userId, p.name, p.age, p.gender, p.blood, p.phone, p.location,
        p.height, p.weight, p.allergies, p.condition, p.meds, p.emergency, p.status, "DOC-001");
      p.history.forEach(([date, reason, notes]) => insertVisit.run(p.id, "DOC-001", date, reason, notes));
    });

    SEED_DOCUMENTS.forEach((d) =>
      insertDoc.run(d.patient, d.name,
        d.name.endsWith(".png") ? "image/png" : d.name.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf",
        d.size, d.at));

    insertConsult.run("C-SEED-001", SEED_CONSULTATION.patient, SEED_CONSULTATION.language,
      SEED_CONSULTATION.concern, JSON.stringify(SEED_CONSULTATION.categories),
      JSON.stringify(SEED_CONSULTATION.answers),
      "Frontend prototype — not a medical diagnosis.", SEED_CONSULTATION.at);
  });
  seed();

  console.log("[seed] demo data created:");
  console.log("[seed]   doctor  -> anil.verma@abha / doctor123");
  console.log("[seed]   patient -> ravi.kumar@abha / patient123");
  return true;
}

module.exports = { seedIfEmpty, SEED_PATIENTS, initials };
