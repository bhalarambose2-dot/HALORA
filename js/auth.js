// js/auth.js

import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================
// SIGNUP
// ==========================
window.signupUser = async function () {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, "users", uid), {
      name,
      email,
      wallet: 0,
      kycStatus: "Pending",
      createdAt: Date.now()
    });
    import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
window.resetPassword = async function () {
  const email = document.getElementById("resetEmail")?.value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent to your email");
    window.location.href = "login.html";
  } catch (error) {
    alert(error.message);
  }
};
    alert("Signup successful!");
    window.location.href = "./dashboard.html";
  } catch (error) {
    alert("Signup Error: " + error.message);
    console.error(error);
  }
};

// ==========================
// LOGIN
// ==========================
window.loginUser = async function () {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "./dashboard.html";
  } catch (error) {
    alert("Login Error: " + error.message);
    console.error(error);
  }
};

// ==========================
// LOGOUT
// ==========================
window.logoutUser = async function () {
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch (error) {
    alert("Logout Error: " + error.message);
  }
};

// ==========================
// PROTECT PAGES
// ==========================
const protectedPages = [
  "dashboard.html",
  "bike-booking.html",
  "wallet.html",
  "hotels.html",
  "history.html",
  "profile-edit.html",
  "documents.html",
  "customer.html",
  "driver.html",
  "rider-live.html"
];

const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "./login.html";
    }
  });
}
