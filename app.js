
const patients = [
  {id:"JS-00124", name:"Ravi Kumar", age:45, gender:"Male", visit:"12 May 2026", condition:"Hypertension", status:"stable", blood:"B+", initials:"RK", allergies:"None", meds:"Amlodipine 5mg", history:[
    ["12 May 2026","BP high","Prescribed Amlodipine 5mg","Dr. Anil Verma"],
    ["10 Apr 2026","Routine checkup","Vitals reviewed; stable","Dr. Anil Verma"],
    ["05 Mar 2026","Fever / cold","Prescribed Paracetamol","Dr. Anil Verma"]
  ]},
  {id:"JS-00131", name:"Sneha Sharma", age:32, gender:"Female", visit:"10 May 2026", condition:"Diabetes — controlled", status:"stable", blood:"O+", initials:"SS", allergies:"Penicillin", meds:"Metformin 500mg", history:[
    ["10 May 2026","Diabetes review","HbA1c reviewed; controlled","Dr. Anil Verma"],
    ["12 Mar 2026","Routine checkup","Medication continued","Dr. Anil Verma"]
  ]},
  {id:"JS-00142", name:"Amit Singh", age:50, gender:"Male", visit:"09 May 2026", condition:"High BP", status:"attention", blood:"A+", initials:"AS", allergies:"None", meds:"Losartan 50mg", history:[
    ["09 May 2026","Elevated BP","Follow-up advised in 7 days","Dr. Anil Verma"],
    ["11 Apr 2026","Routine checkup","BP monitoring advised","Dr. Anil Verma"]
  ]},
  {id:"JS-00157", name:"Pooja Verma", age:28, gender:"Female", visit:"08 May 2026", condition:"Healthy", status:"stable", blood:"AB+", initials:"PV", allergies:"None", meds:"None", history:[
    ["08 May 2026","Annual checkup","No concerns found","Dr. Anil Verma"]
  ]},
  {id:"JS-00168", name:"Mohit Joshi", age:60, gender:"Male", visit:"07 May 2026", condition:"Diabetes", status:"attention", blood:"B-", initials:"MJ", allergies:"None", meds:"Metformin 500mg", history:[
    ["07 May 2026","Blood sugar high","Diet + medication review","Dr. Anil Verma"],
    ["04 Apr 2026","Diabetes follow-up","Medication adjusted","Dr. Anil Verma"]
  ]},
  {id:"JS-00176", name:"Neha Gupta", age:39, gender:"Female", visit:"06 May 2026", condition:"Thyroid", status:"stable", blood:"A+", initials:"NG", allergies:"None", meds:"Levothyroxine", history:[
    ["06 May 2026","Thyroid review","TSH within target","Dr. Anil Verma"]
  ]}
];

let currentRole = "doctor";
let selectedPatient = patients[0];
let questionIndex = 0;
let consultationAnswers = [];
const questions = [
  {q:"What is your main health concern?", help:"Describe what you are feeling in your own words.", type:"text", placeholder:"e.g. Headache, fever, pain in chest..."},
  {q:"How long have you been experiencing this?", type:"choice", options:["Today","2–3 days","About a week","More than a week"]},
  {q:"Do you have any other symptoms?", type:"choice", options:["Fever","Headache","Cough / cold","Pain","Breathing difficulty","None of these"]},
  {q:"Do you have any pre-existing conditions?", type:"choice", options:["Diabetes","High blood pressure","Asthma","Thyroid","None"]},
  {q:"Are you currently taking any medications?", type:"choice", options:["Yes, regularly","Yes, occasionally","No","Not sure"]}
];

const documents = [
  {name:"Blood Report.pdf", size:"1.2 MB", date:"10 May 2026", type:"pdf"},
  {name:"X-Ray Chest.png", size:"2.5 MB", date:"08 May 2026", type:"image"},
  {name:"Prescription.docx", size:"0.8 MB", date:"05 May 2026", type:"doc"},
  {name:"ECG Report.pdf", size:"1.5 MB", date:"01 May 2026", type:"pdf"}
];

function qs(s){return document.querySelector(s)}
function qsa(s){return [...document.querySelectorAll(s)]}
function initials(name){return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}

function showToast(message){
  const wrap=qs("#toastContainer");
  const el=document.createElement("div");
  el.className="toast align-items-center border-0 show";
  el.innerHTML=`<div class="d-flex"><div class="toast-body"><i class="bi bi-check-circle-fill me-2"></i>${message}</div><button class="btn-close me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
  wrap.appendChild(el); setTimeout(()=>el.remove(),3200);
}

function login(){
  const value=qs("#aadhaarInput").value.replace(/\D/g,"");
  if(value.length!==12){showToast("Enter any 12-digit demo Aadhaar number."); return}
  currentRole=qsa(".role-btn").find(b=>b.classList.contains("active")).dataset.role;
  qs("#loginView").classList.add("d-none"); qs("#appView").classList.remove("d-none");
  setupRole();
}

function setupRole(){
  const isDoctor=currentRole==="doctor";
  qs("#doctorPages").classList.toggle("d-none",!isDoctor);
  qs("#patientPages").classList.toggle("d-none",isDoctor);
  qs("#sidebarRole").innerHTML=isDoctor?'<i class="bi bi-person-badge"></i> Doctor portal':'<i class="bi bi-person"></i> Patient portal';
  qs("#sidebarUser").textContent=isDoctor?"Dr. Anil Verma":"Ravi Kumar";
  qs("#topName").textContent=isDoctor?"Dr. Anil Verma":"Ravi Kumar";
  qs("#topRole").textContent=isDoctor?"Doctor":"Patient";
  qs("#topAvatar").textContent=isDoctor?"AV":"RK";
  qs("#sidebarNav").innerHTML=isDoctor?`
    <button class="nav-item-btn active" data-page="dashboard"><i class="bi bi-grid-1x2-fill"></i> Dashboard</button>
    <button class="nav-item-btn" data-page="patients"><i class="bi bi-people-fill"></i> My patients</button>
    <button class="nav-item-btn" data-page="reports"><i class="bi bi-file-earmark-medical-fill"></i> Reports</button>
  `:`
    <button class="nav-item-btn active" data-page="home"><i class="bi bi-grid-1x2-fill"></i> My health</button>
    <button class="nav-item-btn" data-page="consultation"><i class="bi bi-stars"></i> JARVIS check</button>
    <button class="nav-item-btn" data-page="documents"><i class="bi bi-folder2-open"></i> Documents</button>
    <button class="nav-item-btn" data-page="history"><i class="bi bi-clock-history"></i> History</button>
    <button class="nav-item-btn" data-page="profile"><i class="bi bi-person-circle"></i> Profile</button>
  `;
  qsa(".nav-item-btn").forEach(btn=>btn.onclick=()=>{ if(isDoctor) showDoctorPage(btn.dataset.page); else showPatientPage(btn.dataset.page); });
  if(isDoctor){renderPatients(); renderAttention(); showDoctorPage("dashboard")}
  else {renderDocuments(); renderHistory(); renderRecent(); showPatientPage("home")}
}

function showDoctorPage(name){
  const map={dashboard:"doctorDashboard",patients:"allPatients",reports:"doctorReports"};
  qsa("#doctorPages .page").forEach(p=>p.classList.remove("active-page"));
  qs("#"+map[name]).classList.add("active-page");
  qsa(".nav-item-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  qs("#pageTitle").textContent={dashboard:"Dashboard",patients:"My patients",reports:"Reports"}[name]||"Dashboard";
  qs(".sidebar").classList.remove("open");
}

function showPatientPage(name){
  const map={home:"patientHome",consultation:"consultationPage",documents:"documentsPage",history:"historyPage",profile:"patientProfile"};
  qsa("#patientPages .page").forEach(p=>p.classList.remove("active-page"));
  qs("#"+map[name]).classList.add("active-page");
  qsa(".nav-item-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  qs("#pageTitle").textContent={home:"My health",consultation:"JARVIS health check",documents:"Medical documents",history:"Consultation history",profile:"My profile"}[name];
  qs(".sidebar").classList.remove("open");
}

function patientRow(p,i){
  return `<tr>
    <td>${i+1}</td>
    <td><div class="d-flex align-items-center gap-2"><div class="avatar avatar-sm">${p.initials}</div><div><span class="patient-name">${p.name}</span><span class="patient-sub">${p.id}</span></div></div></td>
    <td>${p.age} / ${p.gender[0]}</td><td>${p.visit}</td><td>${p.condition}</td>
    <td><span class="status-pill ${p.status==="stable"?"stable":"attention"}"><i class="bi ${p.status==="stable"?"bi-check-circle-fill":"bi-exclamation-circle-fill"}"></i>${p.status==="stable"?"Stable":"Attention"}</span></td>
    <td><button class="row-action" onclick="openPatient('${p.id}')"><i class="bi bi-chevron-right"></i></button></td>
  </tr>`;
}
function renderPatients(list=patients){qs("#patientTableBody").innerHTML=list.map((p,i)=>patientRow(p,i)).join("");qs("#allPatientBody").innerHTML=list.map((p,i)=>patientRow(p,i)).join("")}
function renderAttention(){
  qs("#attentionList").innerHTML=patients.filter(p=>p.status==="attention").slice(0,4).map(p=>`
    <div class="attention-item" onclick="openPatient('${p.id}')" style="cursor:pointer">
      <div class="avatar avatar-sm">${p.initials}</div><div><strong>${p.name}</strong><small>${p.condition} • Last visit ${p.visit}</small></div><span class="status-dot"></span>
    </div>`).join("");
}
function openPatient(id){
  selectedPatient=patients.find(p=>p.id===id)||patients[0];
  qs("#modalPatientName").textContent=selectedPatient.name;
  qs("#modalPatientBody").innerHTML=`
    <div class="profile-banner mb-3"><div class="avatar avatar-xl">${selectedPatient.initials}</div><div class="profile-main"><h3>${selectedPatient.name}</h3><div class="profile-tags"><span>${selectedPatient.age} years • ${selectedPatient.gender}</span><span>${selectedPatient.blood}</span><span>${selectedPatient.condition}</span></div></div></div>
    <div class="row g-3"><div class="col-md-4"><div class="panel"><small class="text-muted">Allergies</small><h6>${selectedPatient.allergies}</h6></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Medication</small><h6>${selectedPatient.meds}</h6></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Last visit</small><h6>${selectedPatient.visit}</h6></div></div></div>
    <h6 class="mt-4">Past details</h6>${selectedPatient.history.map(h=>`<div class="history-row"><div class="date-box"><strong>${h[0].split(" ")[0]}</strong><small>${h[0].split(" ").slice(1).join(" ")}</small></div><div><h5>${h[1]}</h5><p>${h[2]} • ${h[3]}</p></div></div>`).join("")}`;
  new bootstrap.Modal(qs("#patientModal")).show();
}
function renderDetail(tab="summary"){
  const p=selectedPatient;
  if(tab==="summary"){
    qs("#detailContent").innerHTML=`<div class="row g-3"><div class="col-md-4"><div class="panel"><small class="text-muted">Blood group</small><h5>${p.blood}</h5></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Allergies</small><h5>${p.allergies}</h5></div></div><div class="col-md-4"><div class="panel"><small class="text-muted">Medication</small><h5>${p.meds}</h5></div></div></div><div class="panel mt-3"><h5 class="mb-3">Recent clinical history</h5>${p.history.map(h=>`<div class="history-row"><div class="date-box"><strong>${h[0].split(" ")[0]}</strong><small>${h[0].split(" ")[1]} ${h[0].split(" ")[2]}</small></div><div><h5>${h[1]}</h5><p>${h[2]} • ${h[3]}</p></div></div>`).join("")}</div>`;
  } else {
    const labels={visits:"Past visits",reports:"Reports",prescriptions:"Prescriptions"};
    qs("#detailContent").innerHTML=`<div class="panel"><h5>${labels[tab]}</h5><p class="text-muted small mt-2">Frontend demo data for ${p.name}. This section is ready to connect to your backend/database.</p>${p.history.map(h=>`<div class="history-row"><div class="date-box"><strong>${h[0].split(" ")[0]}</strong><small>${h[0].split(" ")[1]}</small></div><div><h5>${h[1]}</h5><p>${h[2]} • ${h[3]}</p></div><button class="icon-btn ms-auto"><i class="bi bi-eye"></i></button></div>`).join("")}</div>`;
  }
}
function showPatientDetail(id){
  selectedPatient=patients.find(p=>p.id===id)||patients[0];
  qs("#detailName").textContent=selectedPatient.name;qs("#profileName").textContent=selectedPatient.name;
  qs("#detailMeta").textContent=`${selectedPatient.age} years • ${selectedPatient.gender} • Patient ID: ${selectedPatient.id}`;
  qs("#detailAvatar").textContent=selectedPatient.initials;
  qs("#detailStatus").className=`status-pill ${selectedPatient.status==="stable"?"stable":"attention"}`;
  qs("#detailStatus").innerHTML=`<i class="bi ${selectedPatient.status==="stable"?"bi-check-circle-fill":"bi-exclamation-circle-fill"}"></i>${selectedPatient.status==="stable"?"Stable":"Needs attention"}`;
  renderDetail();
  showDoctorPage("dashboard"); setTimeout(()=>{qsa("#doctorPages .page").forEach(p=>p.classList.remove("active-page"));qs("#patientDetail").classList.add("active-page");qs("#pageTitle").textContent="Patient details";},0);
}
function startConsultation(){questionIndex=0;consultationAnswers=[];showPatientPage("consultation");renderQuestion()}
function renderQuestion(){
  const q=questions[questionIndex], total=questions.length, pct=Math.round(((questionIndex+1)/total)*100);
  qs("#questionCounter").textContent=`Question ${questionIndex+1} of ${total}`;qs("#progressPercent").textContent=pct+"%";qs("#questionProgress").style.width=pct+"%";
  let html=`<div class="question-title">${q.q}</div>${q.help?`<div class="question-help">${q.help}</div>`:""}`;
  if(q.type==="text") html+=`<textarea id="answerInput" rows="4" placeholder="${q.placeholder}">${consultationAnswers[questionIndex]||""}</textarea>`;
  else html+=`<div class="choice-grid">${q.options.map(o=>`<button class="choice-btn ${consultationAnswers[questionIndex]===o?"selected":""}" onclick="chooseAnswer(this,'${o.replace(/'/g,"\\'")}')">${o}</button>`).join("")}</div>`;
  html+=`<div class="question-actions"><button class="btn btn-light" ${questionIndex===0?"disabled":""} onclick="prevQuestion()">Back</button><button class="btn btn-primary" onclick="nextQuestion()">${questionIndex===total-1?"Review & save":"Next"} <i class="bi bi-arrow-right ms-1"></i></button></div>`;
  qs("#questionArea").innerHTML=html;
}
function chooseAnswer(el,value){qsa(".choice-btn").forEach(b=>b.classList.remove("selected"));el.classList.add("selected");consultationAnswers[questionIndex]=value}
function nextQuestion(){
  const input=qs("#answerInput");if(input) consultationAnswers[questionIndex]=input.value.trim();
  if(!consultationAnswers[questionIndex]){showToast("Please answer this question before continuing.");return}
  if(questionIndex<questions.length-1){questionIndex++;renderQuestion()}else{saveConsultation()}
}
function prevQuestion(){if(questionIndex>0){questionIndex--;renderQuestion()}}
function saveConsultation(){
  const entry={id:"C-"+Date.now(),date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),answers:[...consultationAnswers]};
  const history=JSON.parse(localStorage.getItem("js_consultations")||"[]");history.unshift(entry);localStorage.setItem("js_consultations",JSON.stringify(history));
  showToast("Consultation saved to demo local storage.");renderHistory();renderRecent();showPatientPage("history");
}
function renderRecent(){
  const history=JSON.parse(localStorage.getItem("js_consultations")||"[]");
  const rows=history.slice(0,3);
  qs("#recentConsultations").innerHTML=(rows.length?rows:[{date:"12 May 2026",answers:["Routine health check completed"]}]).map((h,i)=>`<div class="consult-item"><div class="consult-icon"><i class="bi bi-stars"></i></div><div><strong>JARVIS health check</strong><small>${h.date} • ${h.answers?.[0]||"Routine health check completed"}</small></div><span class="status-pill stable ms-auto"><i class="bi bi-check"></i>Saved</span></div>`).join("");
}
function renderHistory(){
  const history=JSON.parse(localStorage.getItem("js_consultations")||"[]");
  qs("#historyList").innerHTML=(history.length?history:[{date:"12 May 2026",answers:["Routine health check completed","2–3 days","None of these","None","No"]}]).map(h=>`<div class="timeline-item"><div class="timeline-date"><strong>${h.date}</strong><small>JARVIS check</small></div><div class="timeline-line"><div class="timeline-dot"><i class="bi bi-stars"></i></div></div><div class="timeline-card"><strong>Health check-in completed</strong><p>${h.answers?.[0]||"Routine health check completed"}</p><span class="status-pill stable"><i class="bi bi-check-circle-fill"></i> Saved</span></div></div>`).join("");
}
function renderDocuments(){
  const stored=JSON.parse(localStorage.getItem("js_documents")||"[]");
  const all=[...stored,...documents];
  qs("#docCount").textContent=all.length;
  qs("#documentsList").innerHTML=all.map((d,i)=>`<div class="document-row"><div class="file-icon"><i class="bi ${d.type==="image"?"bi-file-earmark-image-fill":d.type==="doc"?"bi-file-earmark-word-fill":"bi-file-earmark-pdf-fill"}"></i></div><div><strong>${d.name}</strong><small>${d.size||"Local file"} • ${d.date||"Just now"}</small></div><span class="status-pill stable"><i class="bi bi-check"></i>Available</span><button class="icon-btn" onclick="showToast('Preview is frontend-only in this prototype.')"><i class="bi bi-eye"></i></button></div>`).join("");
}
function handleFiles(files){
  const existing=JSON.parse(localStorage.getItem("js_documents")||"[]");
  [...files].forEach(file=>existing.unshift({name:file.name,size:(file.size/1024/1024).toFixed(1)+" MB",date:"Just now",type:file.type.includes("image")?"image":file.name.endsWith(".doc")||file.name.endsWith(".docx")?"doc":"pdf"}));
  localStorage.setItem("js_documents",JSON.stringify(existing));renderDocuments();showToast(`${files.length} document(s) added to demo storage.`);
}

document.addEventListener("DOMContentLoaded",()=>{
  qsa(".role-btn").forEach(btn=>btn.addEventListener("click",()=>{qsa(".role-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active")}));
  qs("#loginBtn").onclick=login;qs("#aadhaarInput").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
  qs("#logoutBtn").onclick=()=>{qs("#appView").classList.add("d-none");qs("#loginView").classList.remove("d-none");qs("#aadhaarInput").value=""};
  qs("#mobileMenuBtn").onclick=()=>qs(".sidebar").classList.toggle("open");
  qs("#patientSearch").addEventListener("input",e=>{const term=e.target.value.toLowerCase();renderPatients(patients.filter(p=>`${p.name} ${p.id}`.toLowerCase().includes(term)))});
  qs("#allPatientSearch").addEventListener("input",e=>{const term=e.target.value.toLowerCase();qs("#allPatientBody").innerHTML=patients.filter(p=>`${p.name} ${p.id}`.toLowerCase().includes(term)).map((p,i)=>patientRow(p,i)).join("")});
  qsa("[data-detail-tab]").forEach(tab=>tab.onclick=()=>{qsa("[data-detail-tab]").forEach(t=>t.classList.remove("active"));tab.classList.add("active");renderDetail(tab.dataset.detailTab)});
  qs("#fileInput").addEventListener("change",e=>{if(e.target.files.length)handleFiles(e.target.files);e.target.value=""});
  const zone=qs("#uploadZone");["dragenter","dragover"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.style.borderColor="#1261d6"}));["dragleave","drop"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.style.borderColor="#cdd9e9"}));zone.addEventListener("drop",e=>{if(e.dataTransfer.files.length)handleFiles(e.dataTransfer.files)});
});
