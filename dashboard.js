import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const userEmail = document.getElementById("userEmail");
const list = document.getElementById("studentList");
const form = document.getElementById("studentForm");

onAuthStateChanged(auth, (user) => {
  if (!user) location.href = "index.html";
  else userEmail.textContent = user.email;
});

document.getElementById("logoutBtn").onclick = () => signOut(auth);

form.onsubmit = async (e) => {
  e.preventDefault();
  const student = {
    name: name.value.trim(),
    department: department.value.trim(),
    attendance: Number(attendance.value),
    marks: Number(marks.value),
    skills: Number(skills.value),
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, "students"), student);
  form.reset();
};

onSnapshot(collection(db, "students"), (snapshot) => {
  const students = [];
  list.innerHTML = "";

  snapshot.forEach((item) => {
    const s = item.data();
    students.push(s);
    const risk = s.attendance < 70 || s.marks < 60 ? "High" : s.attendance < 80 ? "Medium" : "Low";
    const div = document.createElement("div");
    div.className = "student";
    div.innerHTML = `
      <div><b>${s.name}</b><br>${s.department} | Attendance: ${s.attendance}% | Marks: ${s.marks}% | Skills: ${s.skills}% | Risk: ${risk}</div>
      <button data-id="${item.id}">Delete</button>
    `;
    div.querySelector("button").onclick = async () => deleteDoc(doc(db, "students", item.id));
    list.appendChild(div);
  });

  const total = students.length;
  const avg = (key) => total ? Math.round(students.reduce((a, b) => a + Number(b[key] || 0), 0) / total) : 0;
  const high = students.filter(s => s.attendance < 70 || s.marks < 60).length;

  totalStudents.textContent = total;
  avgAttendance.textContent = avg("attendance") + "%";
  avgMarks.textContent = avg("marks") + "%";
  highRisk.textContent = high;
});
