// js/driver-panel.js

import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// =============================
// ELEMENTS
// =============================
const currentRideDiv = document.getElementById("currentRide");
const rideActions = document.getElementById("rideActions");
const otpInput = document.getElementById("otpInput");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const completeRideBtn = document.getElementById("completeRideBtn");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const cancelRideBtn = document.getElementById("cancelRideBtn");
const todayEarningsEl = document.getElementById("todayEarnings");

const driverRequestsList = document.getElementById("driverRequestsList");
const driverStatusText = document.getElementById("driverStatusText");
const onlineToggle = document.getElementById("onlineToggle");

const rideRoute = document.getElementById("rideRoute");
const rideCustomer = document.getElementById("rideCustomer");
const rideFare = document.getElementById("rideFare");
const rideOtp = document.getElementById("rideOtp");

let currentUser = null;
let currentRideId = null;
let currentRide = null;

// =============================
// AUTH
// =============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  await ensureDriverWallet();
  await ensureDriverDoc();
  loadTodayEarnings();
  listenCurrentRide();
  listenIncomingRequests();
  loadDriverStatus();
});

// =============================
// ENSURE DRIVER DOC
// =============================
async function ensureDriverDoc() {
  const driverRef = doc(db, "drivers", currentUser.uid);
  const snap = await getDoc(driverRef);

  if (!snap.exists()) {
    await setDoc(driverRef, {
      uid: currentUser.uid,
      name: auth.currentUser.displayName || "HALORA Driver",
      phone: auth.currentUser.phoneNumber || "N/A",
      online: false,
      available: true,
      currentRideId: null,
      createdAt: Date.now()
    });
  }
}

// =============================
// ENSURE DRIVER WALLET
// =============================
async function ensureDriverWallet() {
  const walletRef = doc(db, "wallets", currentUser.uid);
  const snap = await getDoc(walletRef);

  if (!snap.exists()) {
    await setDoc(walletRef, {
      uid: currentUser.uid,
      balance: 0,
      role: "driver",
      createdAt: Date.now()
    });
  }
}

// =============================
// LOAD ONLINE STATUS
// =============================
async function loadDriverStatus() {
  const driverRef = doc(db, "drivers", currentUser.uid);
  const snap = await getDoc(driverRef);

  if (snap.exists()) {
    const data = snap.data();
    onlineToggle.checked = data.online || false;
    driverStatusText.innerText = data.online ? "Online" : "Offline";
  }
}

// =============================
// TOGGLE ONLINE/OFFLINE
// =============================
onlineToggle?.addEventListener("change", async () => {
  try {
    await updateDoc(doc(db, "drivers", currentUser.uid), {
      online: onlineToggle.checked,
      available: onlineToggle.checked
    });

    driverStatusText.innerText = onlineToggle.checked ? "Online" : "Offline";
  } catch (error) {
    alert(error.message);
  }
});

// =============================
// LOAD TODAY EARNINGS
// =============================
async function loadTodayEarnings() {
  try {
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", currentUser.uid),
      where("type", "==", "Driver Earning")
    );

    const snap = await getDocs(q);

    let total = 0;
    const today = new Date().toDateString();

    snap.forEach((docSnap) => {
      const t = docSnap.data();
      const d = new Date(t.createdAt).toDateString();
      if (d === today) {
        total += t.amount || 0;
      }
    });

    todayEarningsEl.textContent = total;
  } catch (error) {
    console.error("Earnings load error:", error);
  }
}

// =============================
// INCOMING REQUESTS
// =============================
function listenIncomingRequests() {
  const q = query(collection(db, "rides"), where("status", "==", "Pending"));

  onSnapshot(q, (snapshot) => {
    driverRequestsList.innerHTML = "";

    if (snapshot.empty) {
      driverRequestsList.innerHTML = "<p>No incoming requests</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const ride = docSnap.data();

      driverRequestsList.innerHTML += `
        <div class="admin-card">
          <p><strong>${ride.pickup || "-"}</strong> → <strong>${ride.drop || "-"}</strong></p>
          <p>Service: ${ride.serviceType || "Ride"}</p>
          <p>Fare: ₹${ride.fare || 0}</p>
          <div class="driver-action-grid">
            <button class="accept-btn" onclick="acceptRide('${docSnap.id}')">Accept</button>
            <button class="secondary-btn" onclick="rejectRide('${docSnap.id}')">Reject</button>
          </div>
        </div>
      `;
    });
  });
}

// =============================
// ACCEPT RIDE
// =============================
window.acceptRide = async function (rideId) {
  try {
    const driverRef = doc(db, "drivers", currentUser.uid);
    const driverSnap = await getDoc(driverRef);
    const driver = driverSnap.data();

    await updateDoc(doc(db, "rides", rideId), {
      status: "Accepted",
      driverId: currentUser.uid,
      driverName: driver?.name || "HALORA Driver",
      driverPhone: driver?.phone || "N/A",
      acceptedAt: Date.now()
    });

    await updateDoc(driverRef, {
      available: false,
      currentRideId: rideId
    });

    alert("Ride accepted successfully!");
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// REJECT RIDE
// =============================
window.rejectRide = async function (rideId) {
  alert("Ride rejected");
};

// =============================
// LISTEN CURRENT RIDE
// =============================
function listenCurrentRide() {
  const q = query(
    collection(db, "rides"),
    where("driverId", "==", currentUser.uid)
  );

  onSnapshot(q, (snapshot) => {
    let found = false;

    snapshot.forEach((docSnap) => {
      const ride = docSnap.data();

      if (["Accepted", "Started"].includes(ride.status)) {
        found = true;
        currentRideId = docSnap.id;
        currentRide = ride;

        rideRoute.innerText = `${ride.pickup || "-"} → ${ride.drop || "-"}`;
        rideCustomer.innerText = `Customer: ${ride.userId || "--"}`;
        rideFare.innerText = `Fare: ₹${ride.fare || 0}`;
        rideOtp.innerText = `OTP: ${ride.otp || "----"}`;
      }
    });

    if (!found) {
      rideRoute.innerText = "No active ride";
      rideCustomer.innerText = "Customer: --";
      rideFare.innerText = "Fare: ₹0";
      rideOtp.innerText = "OTP: ----";
      currentRideId = null;
      currentRide = null;
    }
  });
}

// =============================
// START RIDE
// =============================
window.startRide = async function () {
  if (!currentRide || !currentRideId) {
    alert("No active ride");
    return;
  }

  const enteredOtp = prompt("Enter customer OTP");

  if (!enteredOtp) return;

  if (enteredOtp !== String(currentRide.otp)) {
    alert("Invalid OTP");
    return;
  }

  try {
    await updateDoc(doc(db, "rides", currentRideId), {
      status: "Started",
      startedAt: Date.now()
    });

    alert("Ride started successfully");
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// COMPLETE RIDE
// =============================
window.completeRide = async function () {
  if (!currentRide || !currentRideId) {
    alert("No active ride");
    return;
  }

  try {
    await updateDoc(doc(db, "rides", currentRideId), {
      status: "Completed",
      completedAt: Date.now()
    });

    await updateDoc(doc(db, "drivers", currentUser.uid), {
      available: true,
      currentRideId: null
    });

    alert("Ride completed");
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// WITHDRAW
// =============================
window.withdrawNow = async function () {
  const amount = Number(document.getElementById("withdrawAmount")?.value || 0);

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  alert("Withdraw request submitted!");
};
