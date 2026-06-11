import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);
let students = [], editId = null;

onAuthStateChanged(auth, (user)=>{ if(!user) location.href="index.html"; else $("userEmail").textContent=user.email; });
$("logoutBtn").onclick = () => signOut(auth);

function num(id){ return Number($(id).value || 0); }
function risk(s){ if(s.attendance < 65 || s.marks < 45) return "High"; if(s.attendance < 75 || s.marks < 60) return "Medium"; return "Low"; }
function placement(s){ return Math.round((s.marks + s.skills + s.projects + s.communication)/4); }
function suggestion(s){ const arr=[]; if(s.attendance<75) arr.push("Improve attendance"); if(s.marks<60) arr.push("Focus on marks"); if(s.skills<60) arr.push("Improve technical skills"); if(s.projects<60) arr.push("Add project work"); if(s.communication<60) arr.push("Practice communication"); return arr.length?arr.join(", "):"Good performance"; }
function getForm(){ const s={ name:$("studentName").value.trim(), department:$("department").value.trim(), attendance:num("attendance"), marks:num("marks"), skills:num("skills"), projects:num("projects"), communication:num("communication"), role:$("role").value }; s.risk=risk(s); s.placement=placement(s); s.suggestion=suggestion(s); return s; }
function setForm(s){ editId=s.id; $("studentName").value=s.name; $("department").value=s.department; $("attendance").value=s.attendance; $("marks").value=s.marks; $("skills").value=s.skills; $("projects").value=s.projects; $("communication").value=s.communication; $("role").value=s.role||"student"; }
function clear(){ editId=null; ["studentName","department","attendance","marks","skills","projects","communication"].forEach(id=>$(id).value=""); $("role").value="student"; }
$("clearForm").onclick = clear;
$("saveStudent").onclick = async()=>{ const s=getForm(); if(!s.name||!s.department) return alert("Name and department required"); if(editId) await updateDoc(doc(db,"students",editId), {...s, updatedAt:serverTimestamp()}); else await addDoc(collection(db,"students"), {...s, createdAt:serverTimestamp()}); clear(); };
$("search").oninput = render;

onSnapshot(collection(db,"students"), (snap)=>{ students=snap.docs.map(d=>({id:d.id,...d.data()})); render(); });
function render(){ const q=$("search").value.toLowerCase(); const list=students.filter(s=>(s.name||"").toLowerCase().includes(q)||(s.department||"").toLowerCase().includes(q)); $("totalStudents").textContent=students.length; $("avgAttendance").textContent=avg("attendance")+"%"; $("avgMarks").textContent=avg("marks")+"%"; $("highRisk").textContent=students.filter(s=>s.risk==="High").length; $("studentList").innerHTML=list.map(s=>`<div class="student-card"><b>${s.name}</b><span>${s.department} | Attendance ${s.attendance}% | Marks ${s.marks}% | Risk ${s.risk} | Placement ${s.placement}%</span><small>AI: ${s.suggestion}</small><button data-edit="${s.id}">Edit</button><button data-del="${s.id}" class="danger">Delete</button></div>`).join(""); document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>setForm(students.find(s=>s.id===b.dataset.edit))); document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteDoc(doc(db,"students",b.dataset.del))); }
function avg(k){ if(!students.length) return 0; return Math.round(students.reduce((a,s)=>a+Number(s[k]||0),0)/students.length); }

$("askBtn").onclick=()=>{ const q=$("chatInput").value.toLowerCase(); let ans="Ask about high risk, top student, average attendance, placement ready."; if(q.includes("high")) ans = students.filter(s=>s.risk==="High").map(s=>s.name).join(", ") || "High risk students illa."; if(q.includes("top")) ans = [...students].sort((a,b)=>b.marks-a.marks)[0]?.name || "No data"; if(q.includes("average")||q.includes("attendance")) ans = `Average attendance ${avg("attendance")}%`; if(q.includes("placement")) ans = students.filter(s=>s.placement>=70).map(s=>`${s.name} (${s.placement}%)`).join(", ") || "Placement ready students illa."; $("chatOutput").textContent=ans; };
$("downloadPdf").onclick=()=>{ const { jsPDF } = window.jspdf; const pdf=new jsPDF(); pdf.text("CampusMind AI Report",20,20); pdf.text(`Total Students: ${students.length}`,20,35); pdf.text(`Avg Attendance: ${avg("attendance")}%`,20,45); pdf.text(`Avg Marks: ${avg("marks")}%`,20,55); let y=70; students.slice(0,20).forEach(s=>{ pdf.text(`${s.name} - ${s.department} - Risk: ${s.risk} - Placement: ${s.placement}%`,20,y); y+=10; }); pdf.save("CampusMind-AI-Report.pdf"); };
$("exportJson").onclick=()=>{ const blob=new Blob([JSON.stringify(students,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="students.json"; a.click(); };
