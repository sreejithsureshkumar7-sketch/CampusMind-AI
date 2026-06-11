const STORAGE_KEY = "campusmind_students_v2";
const FIREBASE_CONFIG_KEY = "campusmind_firebase_config";

const sampleStudents = [
  { name: "Sreejith", regNo: "BCA001", department: "BCA", year: "2nd Year", attendance: 88, marks: 82, skills: 86, communication: 78, projects: 90 },
  { name: "Rahul", regNo: "BCA002", department: "BCA", year: "2nd Year", attendance: 62, marks: 55, skills: 58, communication: 60, projects: 45 },
  { name: "Priya", regNo: "CSE101", department: "CSE", year: "3rd Year", attendance: 94, marks: 91, skills: 88, communication: 86, projects: 92 },
  { name: "Kavin", regNo: "IT204", department: "IT", year: "2nd Year", attendance: 74, marks: 69, skills: 72, communication: 66, projects: 70 },
  { name: "Anu", regNo: "CSE102", department: "CSE", year: "1st Year", attendance: 81, marks: 76, skills: 70, communication: 82, projects: 74 }
];

let students = [];
let firebaseApp = null;
let db = null;
let firestore = null;
let unsubscribe = null;
let usingFirebase = false;

const $ = (id) => document.getElementById(id);

const els = {
  connectionDot: $("connectionDot"),
  connectionTitle: $("connectionTitle"),
  connectionText: $("connectionText"),
  totalStudents: $("totalStudents"),
  avgAttendance: $("avgAttendance"),
  avgMarks: $("avgMarks"),
  highRisk: $("highRisk"),
  placementReady: $("placementReady"),
  studentTable: $("studentTable"),
  searchInput: $("searchInput"),
  deptChart: $("deptChart"),
  performanceChart: $("performanceChart"),
  aiInsights: $("aiInsights"),
  studentDialog: $("studentDialog"),
  firebaseDialog: $("firebaseDialog"),
  studentForm: $("studentForm"),
  firebaseForm: $("firebaseForm"),
  toast: $("toast")
};

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 2500);
}

function numberValue(id) {
  const value = Number($(id).value);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getPlacementScore(student) {
  return Math.round((student.marks * 0.35) + (student.skills * 0.25) + (student.projects * 0.25) + (student.communication * 0.15));
}

function getRisk(student) {
  const placementScore = getPlacementScore(student);
  if (student.attendance < 65 || student.marks < 50 || placementScore < 50) return "High";
  if (student.attendance < 80 || student.marks < 70 || placementScore < 70) return "Medium";
  return "Low";
}

function getSuggestion(student) {
  const risk = getRisk(student);
  if (risk === "High") {
    return `${student.name} needs urgent support: attendance improve pannunga, weak subjects ku daily practice, mini project work start pannunga.`;
  }
  if (risk === "Medium") {
    return `${student.name} needs improvement: marks/skills score 70+ target panni weekly progress check pannunga.`;
  }
  return `${student.name} is performing well: placement preparation, resume, GitHub projects improve pannalam.`;
}

function normalizeStudent(student) {
  return {
    id: student.id || crypto.randomUUID(),
    name: String(student.name || "").trim(),
    regNo: String(student.regNo || "").trim(),
    department: String(student.department || "").trim(),
    year: String(student.year || "1st Year"),
    attendance: Number(student.attendance) || 0,
    marks: Number(student.marks) || 0,
    skills: Number(student.skills) || 0,
    communication: Number(student.communication) || 0,
    projects: Number(student.projects) || 0,
    updatedAt: new Date().toISOString()
  };
}

function setConnection(mode, message = "") {
  els.connectionDot.classList.remove("online", "error");
  if (mode === "firebase") {
    els.connectionDot.classList.add("online");
    els.connectionTitle.textContent = "Firebase Connected";
    els.connectionText.textContent = message || "Firestore live sync enabled";
  } else if (mode === "error") {
    els.connectionDot.classList.add("error");
    els.connectionTitle.textContent = "Firebase Error";
    els.connectionText.textContent = message || "Config / rules check pannunga";
  } else {
    els.connectionTitle.textContent = "Local Mode";
    els.connectionText.textContent = message || "Browser storage-la save aagum";
  }
}

function loadLocalStudents() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      students = JSON.parse(saved).map(normalizeStudent);
      return;
    } catch (err) {
      console.warn(err);
    }
  }
  students = sampleStudents.map(normalizeStudent);
  saveLocalStudents();
}

function saveLocalStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function parseFirebaseConfig(input) {
  let text = String(input || "").trim();
  if (!text) throw new Error("Empty config");
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) text = text.slice(firstBrace, lastBrace + 1);
  text = text
    .replace(/;\s*$/, "")
    .replace(/([,{]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"');
  return JSON.parse(text);
}

async function initFirebaseFromStorage() {
  const rawConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (!rawConfig) {
    setConnection("local", "Firebase setup pannala");
    loadLocalStudents();
    render();
    return;
  }

  try {
    const config = parseFirebaseConfig(rawConfig);
    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    firestore = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    firebaseApp = appModule.initializeApp(config);
    db = firestore.getFirestore(firebaseApp);
    usingFirebase = true;
    setConnection("firebase");
    listenStudentsFromFirebase();
  } catch (error) {
    console.error(error);
    usingFirebase = false;
    setConnection("error", "Config invalid / internet issue");
    loadLocalStudents();
    render();
  }
}

function listenStudentsFromFirebase() {
  const q = firestore.query(firestore.collection(db, "students"), firestore.orderBy("updatedAt", "desc"));
  unsubscribe?.();
  unsubscribe = firestore.onSnapshot(q, (snapshot) => {
    students = snapshot.docs.map((doc) => normalizeStudent({ id: doc.id, ...doc.data() }));
    render();
  }, (error) => {
    console.error(error);
    setConnection("error", "Firestore rules / index check pannunga");
    showToast("Firebase read error. Firestore rules check pannunga.");
  });
}

async function saveStudent(student) {
  const clean = normalizeStudent(student);
  if (usingFirebase && db && firestore) {
    await firestore.setDoc(firestore.doc(db, "students", clean.id), clean, { merge: true });
    showToast("Student Firebase-la save aachu");
  } else {
    const index = students.findIndex((item) => item.id === clean.id);
    if (index >= 0) students[index] = clean;
    else students.unshift(clean);
    saveLocalStudents();
    render();
    showToast("Student local-la save aachu");
  }
}

async function deleteStudent(id) {
  const target = students.find((item) => item.id === id);
  const ok = confirm(`${target?.name || "Student"} data delete pannalama?`);
  if (!ok) return;

  if (usingFirebase && db && firestore) {
    await firestore.deleteDoc(firestore.doc(db, "students", id));
    showToast("Student delete aachu");
  } else {
    students = students.filter((item) => item.id !== id);
    saveLocalStudents();
    render();
    showToast("Student delete aachu");
  }
}

function getFilteredStudents() {
  const query = els.searchInput.value.toLowerCase().trim();
  if (!query) return students;
  return students.filter((student) => [student.name, student.regNo, student.department, student.year]
    .join(" ")
    .toLowerCase()
    .includes(query));
}

function renderMetrics() {
  const total = students.length;
  const avg = (key) => total ? Math.round(students.reduce((sum, item) => sum + Number(item[key] || 0), 0) / total) : 0;
  const highRisk = students.filter((item) => getRisk(item) === "High").length;
  const placementReady = students.filter((item) => getPlacementScore(item) >= 70).length;

  els.totalStudents.textContent = total;
  els.avgAttendance.textContent = `${avg("attendance")}%`;
  els.avgMarks.textContent = `${avg("marks")}%`;
  els.highRisk.textContent = highRisk;
  els.placementReady.textContent = placementReady;
}

function renderTable() {
  const data = getFilteredStudents();
  if (!data.length) {
    els.studentTable.innerHTML = `<tr><td colspan="9">No students found. Add Student click pannunga.</td></tr>`;
    return;
  }

  els.studentTable.innerHTML = data.map((student) => {
    const risk = getRisk(student);
    const placement = getPlacementScore(student);
    return `
      <tr>
        <td><strong>${escapeHtml(student.name)}</strong></td>
        <td>${escapeHtml(student.regNo)}</td>
        <td>${escapeHtml(student.department)}</td>
        <td>${escapeHtml(student.year)}</td>
        <td>${student.attendance}%</td>
        <td>${student.marks}%</td>
        <td>${placement}%</td>
        <td><span class="badge ${risk.toLowerCase()}">${risk}</span></td>
        <td>
          <button class="action-btn" data-edit="${student.id}">Edit</button>
          <button class="action-btn delete" data-delete="${student.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderCharts() {
  const deptCounts = students.reduce((acc, student) => {
    const dept = student.department || "Unknown";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  const maxDept = Math.max(1, ...Object.values(deptCounts));
  els.deptChart.innerHTML = Object.entries(deptCounts).map(([dept, count]) => chartRow(dept, count, Math.round((count / maxDept) * 100))).join("") || "No data";

  const top = [...students].sort((a, b) => getPlacementScore(b) - getPlacementScore(a)).slice(0, 6);
  els.performanceChart.innerHTML = top.map((student) => chartRow(student.name, `${getPlacementScore(student)}%`, getPlacementScore(student))).join("") || "No data";
}

function chartRow(label, value, width) {
  return `
    <div class="bar-row">
      <div class="bar-meta"><span>${escapeHtml(String(label))}</span><strong>${escapeHtml(String(value))}</strong></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${Math.max(4, Math.min(100, width))}%"></div></div>
    </div>
  `;
}

function renderInsights() {
  const highRiskStudents = students.filter((item) => getRisk(item) === "High").slice(0, 4);
  const bestStudents = [...students].sort((a, b) => getPlacementScore(b) - getPlacementScore(a)).slice(0, 3);
  const avgAttendance = students.length ? Math.round(students.reduce((sum, item) => sum + item.attendance, 0) / students.length) : 0;

  const cards = [];
  cards.push({
    title: "AI Summary",
    text: students.length
      ? `Total ${students.length} students analyze pannirukku. Average attendance ${avgAttendance}%. High risk students count ${highRiskStudents.length}.`
      : "Data add pannina AI insight automatic varum."
  });

  if (highRiskStudents.length) {
    cards.push({ title: "Risk Alert", text: highRiskStudents.map(getSuggestion).join(" ") });
  } else {
    cards.push({ title: "Risk Alert", text: "Current data-la high risk students illa. Regular monitoring continue pannunga." });
  }

  if (bestStudents.length) {
    cards.push({ title: "Top Placement Ready", text: bestStudents.map((student) => `${student.name} (${getPlacementScore(student)}%)`).join(", ") });
  }

  cards.push({
    title: "Career Recommendation Logic",
    text: "Marks + skills + project + communication score combine panni placement readiness calculate pannum. Low score irundha improvement suggestion auto generate aagum."
  });

  els.aiInsights.innerHTML = cards.map((card) => `
    <article class="insight-card">
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.text)}</p>
    </article>
  `).join("");
}

function render() {
  renderMetrics();
  renderTable();
  renderCharts();
  renderInsights();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openStudentForm(student = null) {
  $("formTitle").textContent = student ? "Edit Student" : "Add Student";
  $("studentId").value = student?.id || crypto.randomUUID();
  $("name").value = student?.name || "";
  $("regNo").value = student?.regNo || "";
  $("department").value = student?.department || "";
  $("year").value = student?.year || "1st Year";
  $("attendance").value = student?.attendance ?? "";
  $("marks").value = student?.marks ?? "";
  $("skills").value = student?.skills ?? "";
  $("communication").value = student?.communication ?? "";
  $("projects").value = student?.projects ?? "";
  els.studentDialog.showModal();
}

function resetStudentForm() {
  $("studentId").value = crypto.randomUUID();
  els.studentForm.reset();
}

function openFirebaseDialog() {
  $("firebaseConfigInput").value = localStorage.getItem(FIREBASE_CONFIG_KEY) || "";
  els.firebaseDialog.showModal();
}

async function seedSampleData() {
  const ok = confirm("Sample data load pannalama? Existing data kooda irukkum.");
  if (!ok) return;
  for (const item of sampleStudents) {
    await saveStudent({ ...item, id: crypto.randomUUID() });
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(students, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "campusmind-students.json";
  a.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  $("openStudentFormBtn").addEventListener("click", () => openStudentForm());
  $("closeStudentDialog").addEventListener("click", () => els.studentDialog.close());
  $("resetFormBtn").addEventListener("click", resetStudentForm);
  $("openFirebaseBtn").addEventListener("click", openFirebaseDialog);
  $("openFirebaseBtn2").addEventListener("click", openFirebaseDialog);
  $("closeFirebaseDialog").addEventListener("click", () => els.firebaseDialog.close());
  $("seedBtn").addEventListener("click", seedSampleData);
  $("exportBtn").addEventListener("click", exportData);
  els.searchInput.addEventListener("input", renderTable);

  els.studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const student = {
      id: $("studentId").value || crypto.randomUUID(),
      name: $("name").value,
      regNo: $("regNo").value,
      department: $("department").value,
      year: $("year").value,
      attendance: numberValue("attendance"),
      marks: numberValue("marks"),
      skills: numberValue("skills"),
      communication: numberValue("communication"),
      projects: numberValue("projects")
    };
    await saveStudent(student);
    els.studentDialog.close();
  });

  els.firebaseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const raw = $("firebaseConfigInput").value.trim();
      const config = parseFirebaseConfig(raw);
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
      els.firebaseDialog.close();
      showToast("Firebase config saved. Connecting...");
      await initFirebaseFromStorage();
    } catch (error) {
      showToast("Config JSON format wrong. Double quotes use pannunga.");
    }
  });

  $("clearFirebaseBtn").addEventListener("click", () => {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    usingFirebase = false;
    unsubscribe?.();
    els.firebaseDialog.close();
    setConnection("local", "Firebase config cleared");
    loadLocalStudents();
    render();
  });

  els.studentTable.addEventListener("click", (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;
    if (editId) {
      const student = students.find((item) => item.id === editId);
      if (student) openStudentForm(student);
    }
    if (deleteId) deleteStudent(deleteId);
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

bindEvents();
initFirebaseFromStorage();
