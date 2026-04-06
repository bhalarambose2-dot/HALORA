// driver-live.js

import { auth, db } from "./js/firebase-config.js";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import "./js/driver-location.js";

const statusEl = document.getElementById("driverStatus");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const driverRef = doc(db, "drivers", user.uid);
  const driverSnap = await getDoc(driverRef);

  if (!driverSnap.exists()) {
    await setDoc(driverRef, {
      uid: user.uid,
      name: user.displayName || "Driver",
      phone: user.phoneNumber || "",
      online: false,
      available: false,
      createdAt: Date.now()
    });
  }

  loadDriverStatus();
});

async function loadDriverStatus() {
  if (!currentUser) return;

  const driverRef = doc(db, "drivers", currentUser.uid);
  const snap = await getDoc(driverRef);

  if (snap.exists()) {
    const data = snap.data();
    statusEl.innerText = data.online
      ? "Status: Online 🟢"
      : "Status: Offline 🔴";
  }
}

window.setDriverOnline = async function () {
  if (!currentUser) return;

  try {
    await updateDoc(doc(db, "drivers", currentUser.uid), {
      online: true,
      available: true,
      lastOnlineAt: Date.now()
    });

    window.startDriverTracking();
    statusEl.innerText = "Status: Online 🟢";
    alert("You are now online");
  } catch (error) {
    alert(error.message);
  }
};

window.setDriverOffline = async function () {
  if (!currentUser) return;

  try {
    await updateDoc(doc(db, "drivers", currentUser.uid), {
      online: false,
      available: false
    });

    window.stopDriverTracking();
    statusEl.innerText = "Status: Offline 🔴";
    alert("You are now offline");
  } catch (error) {
    alert(error.message);
  }
};
