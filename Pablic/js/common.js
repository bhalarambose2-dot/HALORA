import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function showMsg(msg) {
  alert(msg);
}

export async function ensureProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) return userSnap.data();

  const profile = {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || "",
    role: "customer",
    wallet: 0,
    createdAt: serverTimestamp()
  };

  await setDoc(userRef, profile);
  return profile;
}

export async function getCurrentProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) return userSnap.data();

  const driverRef = doc(db, "drivers", user.uid);
  const driverSnap = await getDoc(driverRef);
  if (driverSnap.exists()) return { ...driverSnap.data(), role: "driver" };

  return null;
}

export function guardPage(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    callback(user);
  });
}

export function bindLogout(btnId = "logoutBtn") {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

export function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

export function currency(n = 0) {
  return `₹${Number(n || 0).toFixed(0)}`;
}

export function statusBadge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}
