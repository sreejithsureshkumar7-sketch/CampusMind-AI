import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const msg = document.getElementById("authMsg");

onAuthStateChanged(auth, (user) => {
  if (user) location.href = "dashboard.html";
});

function getValues(){
  return {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value.trim()
  };
}

document.getElementById("loginBtn").onclick = async () => {
  const { email, password } = getValues();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    msg.textContent = "Login success";
  } catch (e) {
    msg.textContent = e.message;
  }
};

document.getElementById("registerBtn").onclick = async () => {
  const { email, password } = getValues();
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    msg.textContent = "Account created";
  } catch (e) {
    msg.textContent = e.message;
  }
};

document.getElementById("forgotBtn").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  if (!email) return msg.textContent = "Enter email first";
  try {
    await sendPasswordResetEmail(auth, email);
    msg.textContent = "Password reset email sent";
  } catch (e) {
    msg.textContent = e.message;
  }
};
