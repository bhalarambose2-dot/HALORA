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

const currentRideDiv = document.getElementById("currentRide");
const rideActions = document.getElementById("rideActions");
const otpInput = document.getElementById("otpInput");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const completeRideBtn = document.getElementById("completeRideBtn");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const cancelRideBtn = document.getElementById("cancelRideBtn");
const todayEarningsEl = document.getElementById("todayEarnings");

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
  loadTodayEarnings();
  listenCurrentRide();
});

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

      if (["Driver Assigned", "Accepted", "Started"].includes(ride.status)) {
        found = true;
        currentRideId = docSnap.id;
        currentRide = ride;

        currentRideDiv.innerHTML = `
          <h3>${ride.pickup || "-"} → ${ride.drop || "-"}</h3>
          <p><strong>Fare:</strong> ₹${ride.fare || 0}</p>
          <p><strong>Status:</strong> ${ride.status || "Pending"}</p>
          <p><strong>Payment:</strong> ${ride.paymentStatus || "unpaid"}</p>
          <p><strong>Customer OTP:</strong> ${ride.otp || "Not available yet"}</p>
        `;

        rideActions.style.display = "block";

        // Button states
        if (ride.status === "Driver Assigned") {
          otpInput.style.display = "block";
          verifyOtpBtn.style.display = "block";
          completeRideBtn.style.display = "none";
          confirmPaymentBtn.style.display = "none";
        }

        if (ride.status === "Accepted" || ride.status === "Started") {
          otpInput.style.display = "block";
          verifyOtpBtn.style.display = "block";
          completeRideBtn.style.display = "block";
          confirmPaymentBtn.style.display = "block";
        }

        if (ride.status === "Started") {
          verifyOtpBtn.innerText = "Ride Started";
          verifyOtpBtn.disabled = true;
        }
      }
    });

    if (!found) {
      currentRideDiv.innerHTML = "<p>No active ride currently</p>";
      rideActions.style.display = "none";
      currentRideId = null;
      currentRide = null;
    }
  });
}

// =============================
// VERIFY OTP & START RIDE
// =============================
verifyOtpBtn.addEventListener("click", async () => {
  if (!currentRide || !currentRideId) return;

  const enteredOtp = otpInput.value.trim();

  if (!enteredOtp) {
    alert("Enter OTP first");
    return;
  }

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
});

// =============================
// COMPLETE RIDE
// =============================
completeRideBtn.addEventListener("click", async () => {
  if (!currentRide || !currentRideId) return;

  try {
    await updateDoc(doc(db, "rides", currentRideId), {
      status: "Completed",
      completedAt: Date.now()
    });

    // Driver available again
    await updateDoc(doc(db, "drivers", currentUser.uid), {
      available: true,
      currentRideId: null
    });

    alert("Ride completed");
  } catch (error) {
    alert(error.message);
  }
});

// =============================
// CONFIRM PAYMENT
// =============================
confirmPaymentBtn.addEventListener("click", async () => {
  if (!currentRide || !currentRideId) return;

  try {
    const fare = Number(currentRide.fare || 0);
    const driverEarning = Math.round(fare * 0.85); // 85% driver, 15% platform

    // Update ride payment
    await updateDoc(doc(db, "rides", currentRideId), {
      paymentStatus: "paid",
      paymentConfirmedAt: Date.now()
    });

    // Update wallet
    const walletRef = doc(db, "wallets", currentUser.uid);
    const walletSnap = await getDoc(walletRef);
    const currentBalance = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;

    await updateDoc(walletRef, {
      balance: currentBalance + driverEarning
    });

    // Transaction
    await addDoc(collection(db, "transactions"), {
      uid: currentUser.uid,
      type: "Driver Earning",
      amount: driverEarning,
      rideId: currentRideId,
      status: "Success",
      createdAt: Date.now()
    });

    alert(`Payment confirmed. ₹${driverEarning} added to wallet.`);
    loadTodayEarnings();
  } catch (error) {
    alert(error.message);
  }
});

// =============================
// CANCEL RIDE
// =============================
cancelRideBtn.addEventListener("click", async () => {
  if (!currentRideId) return;

  if (!confirm("Cancel this ride?")) return;

  try {
    await updateDoc(doc(db, "rides", currentRideId), {
      status: "Cancelled",
      cancelledBy: "driver",
      cancelledAt: Date.now()
    });

    await updateDoc(doc(db, "drivers", currentUser.uid), {
      available: true,
      currentRideId: null
    });

    alert("Ride cancelled");
  } catch (error) {
    alert(error.message);
  }
});
