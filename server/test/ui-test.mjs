import { JSDOM } from "jsdom";

const BASE = "http://localhost:8000";
const html = await (await fetch(BASE + "/index.html")).text();

// Run the page for real (inline onclick handlers must compile) but drop the CDN bootstrap tag.
const prepared = html.replace('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>', "");
const dom = new JSDOM(prepared, { url: BASE + "/", runScripts: "dangerously", resources: "usable", pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;

// Node-context bridge: jsdom has no fetch; stub the Bootstrap modal used by the patient view.
window.JS_API_BASE = BASE;
window.fetch = fetch;
window.bootstrap = { Modal: class { show() {} } };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, cond) => { results.push([name, !!cond]); console.log(cond ? "✔" : "✘", name); };

await sleep(150); // let DOMContentLoaded init run inside the page
let avail = window.Backend.available;
for (let i = 0; i < 30 && avail !== true; i++) { await sleep(100); avail = window.Backend.available; }
check("backend detected as available", avail === true);

// ---- 1. login through the real UI ----
doc.querySelector('.auth-method[data-auth="abha"]').click();
doc.querySelector("#aadhaarInput").value = "ravi.kumar@abha";
doc.querySelector("#loginBtn").click();          // real button handler (async login())
await sleep(400);
check("identifier accepted -> password step shown", !doc.querySelector("#passwordStep").classList.contains("d-none"));
doc.querySelector("#passwordInput").value = "patient123";
doc.querySelector("#passwordLoginBtn").click();  // real button handler (completePasswordLogin())
await sleep(600);
check("app view visible after login", !doc.querySelector("#appView").classList.contains("d-none"));

// ---- 2. start JARVIS check via the real button ----
doc.querySelector('[data-page="consultation"]')?.click();
await window.startConsultation();
await sleep(150);
let guard = 0, clicksChecked = 0, clicksOk = 0, saved = false;
const beforeCount = (await (await fetch(BASE + "/api/consultations", { headers: { Authorization: "Bearer " + window.Backend.token } })).json()).length;
while (guard++ < 40) {
  const nextBtn = doc.querySelector("#questionArea .question-actions .btn-primary");
  if (!nextBtn) break;
  if (/review/i.test(nextBtn.textContent)) {          // last question -> saves
    const ta = doc.querySelector("#answerInput");
    if (ta) ta.value = "nothing else to add";
    nextBtn.click();
    await sleep(700);
    saved = true;
    break;
  }
  const qText = doc.querySelector("#questionArea .question-title")?.textContent || "";
  const btns = [...doc.querySelectorAll("#questionArea .choice-btn")];
  if (btns.length) {
    btns[0].click();                                   // exercises the fixed inline onclick
    clicksChecked++;
    if (doc.querySelector("#questionArea .choice-btn.selected")) clicksOk++;
    if (qText.toLowerCase().includes("symptom") && btns[1]) btns[1].click();
  } else {
    const ta = doc.querySelector("#answerInput");
    if (ta) ta.value = "knee pain since monday";
  }
  nextBtn.click();
  await sleep(40);
}
check(`choice buttons selectable via inline onclick (${clicksOk}/${clicksChecked})`, clicksChecked > 0 && clicksOk === clicksChecked);
check("questionnaire completed all questions and saved", saved);
const afterList = await (await fetch(BASE + "/api/consultations", { headers: { Authorization: "Bearer " + window.Backend.token } })).json();
check("exactly one new consultation created (" + (afterList.length - beforeCount) + ")", afterList.length - beforeCount === 1);

// ---- 3. finish: the upload step's flow saves the consultation server-side ----
await window.saveConsultation();
await sleep(600);
const tok = window.Backend.token;
check("session token stored", !!tok);
const list = await (await fetch(BASE + "/api/consultations", { headers: { Authorization: "Bearer " + tok } })).json();
check("consultation persisted on server (" + list.length + " total)", list.length >= 1);
check("server stored the concern text", (list[0]?.concern || "").length > 0);
check("history timeline rendered from server data", doc.querySelector("#historyList").innerHTML.includes("timeline-card"));

// ---- 4. doctor flow: login as doctor, open patient detail ----
doc.querySelector("#logoutBtn").click();
await sleep(200);
doc.querySelector('.role-btn[data-role="doctor"]').click();
doc.querySelector("#aadhaarInput").value = "anil.verma@abha";
doc.querySelector("#loginBtn").click();
await sleep(400);
doc.querySelector("#passwordInput").value = "doctor123";
doc.querySelector("#passwordLoginBtn").click();
await sleep(800);
check("doctor dashboard visible", !doc.querySelector("#doctorDashboard").classList.contains("active-page") === false);
const rows = doc.querySelectorAll("#patientTableBody tr").length;
check("patient table hydrated from API (" + rows + " rows)", rows >= 6);
await window.showPatientDetail("JS-00124");
await sleep(400);
doc.querySelector('[data-detail-tab="reports"]')?.click();
const rep = doc.querySelector("#detailContent").innerHTML;
check("reports tab shows server consultations", rep.includes("JARVIS consultations"));

const fails = results.filter((r) => !r[1]).length;
console.log(`\n${results.length - fails}/${results.length} UI checks passed`);
process.exit(fails ? 1 : 0);
