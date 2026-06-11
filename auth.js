import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const $ = (id) => document.getElementById(id);
const show = (t) => $("msg").textContent = t;

onAuthStateChanged(auth, (user) => { if (user) location.href = "dashboard.html"; });
function values(){ return { email: $("email").value.trim(), password: $("password").value.trim() }; }
$("loginBtn").onclick = async () => { const {email,password}=values(); try{ await signInWithEmailAndPassword(auth,email,password); show("Login success"); }catch(e){ show("Firebase: "+e.code); } };
$("registerBtn").onclick = async () => { const {email,password}=values(); try{ await createUserWithEmailAndPassword(auth,email,password); show("Account created"); }catch(e){ show("Firebase: "+e.code); } };
$("forgotBtn").onclick = async () => { const {email}=values(); try{ await sendPasswordResetEmail(auth,email); show("Reset mail sent"); }catch(e){ show("Firebase: "+e.code); } };
