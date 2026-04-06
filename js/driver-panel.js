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
// HTML ELEMENTS
// =============================
const currentRideDiv = document.getElementById("currentRide");
const rideActions = document.getElementById("rideActions");
const otpInput = document.getElementById("otpInput");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const completeRideBtn = document.getElementById("completeRideBtn");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const cancelRideBtn = document.getElementById("cancelRideBtn");
const todayEarningsEl = document.getElementById("todayEarnings");
const acceptRideBtn = document.getElementById("acceptRideBtn");

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
// BUTTON STATE RESET
// =============================
function resetRideButtons() {
  if (acceptRideBtn) {
    acceptRideBtn.style.display = "none";
    acceptRideBtn.disabled = false;
  }

  otpInput.style.display = "none";
  otpInput.value = "";

  verifyOtpBtn.style.display = "none";
  verifyOtpBtn.disabled = false;
  verifyOtpBtn.innerText = "Verify OTP & Start Ride";

  completeRideBtn.style.display = "none";
  completeRideBtn.disabled = false;

  confirmPaymentBtn.style.display = "none";
  confirmPaymentBtn.disabled = false;

  cancelRideBtn.style.display = "none";
  cancelRideBtn.disabled = false;
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

      // Only active rides
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
        resetRideButtons();

        // =============================
        // DRIVER ASSIGNED → ONLY ACCEPT
        // =============================
        if (ride.status === "Driver Assigned") {
          if (acceptRideBtn) acceptRideBtn.style.display = "inline-block";
          cancelRideBtn.style.display = "inline-block";
        }

        // =============================
        // ACCEPTED → OTP VERIFY
        // =============================
        if (ride.status === "Accepted") {
          otpInput.style.display = "block";
          verifyOtpBtn.style.display = "inline-block";
          cancelRideBtn.style.display = "inline-block";
        }

        // =============================
        // STARTED → COMPLETE + PAYMENT
        // =============================
        if (ride.status === "Started") {
          otpInput.style.display = "none";
          verifyOtpBtn.style.display = "inline-block";
          verifyOtpBtn.innerText = "Ride Started";
          verifyOtpBtn.disabled = true;

          completeRideBtn.style.display = "inline-block";
          cancelRideBtn.style.display = "inline-block";

          // Payment button only if unpaid
          if ((ride.paymentStatus || "").toLowerCase() !== "paid") {
            confirmPaymentBtn.style.display = "inline-block";
          }
        }
      }
    });

    if (!found) {
      currentRideDiv.innerHTML = "<p>No active ride currently</p>";
      rideActions.style.display = "none";
      currentRideId = null;
      currentRide = null;
      resetRideButtons();
    }
  });
}

// =============================
// ACCEPT RIDE
// =============================
if (acceptRideBtn) {
  acceptRideBtn.addEventListener("click", async () => {
    if (!currentRide || !currentRideId) return;

    try {
      await updateDoc(doc(db, "rides", currentRideId), {
        status: "Accepted",
        acceptedAt: Date.now()
      });

      await updateDoc(doc(db, "drivers", currentUser.uid), {
        available: false,
        currentRideId: currentRideId
      });

      alert("Ride accepted successfully");
    } catch (error) {
      alert(error.message);
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
// CONFIRM PAYMENT
// =============================
confirmPaymentBtn.addEventListener("click", async () => {
  if (!currentRide || !currentRideId) return;

  try {
    // Prevent duplicate payment
    const rideRef = doc(db, "rides", currentRideId);
    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      alert("Ride not found");
      return;
    }

    const freshRide = rideSnap.data();

    if ((freshRide.paymentStatus || "").toLowerCase() === "paid") {
      alert("Payment already confirmed");
      return;
    }

    const fare = Number(freshRide.fare || 0);
    const driverEarning = Math.round(fare * 0.85); // 85% driver

    // Update ride payment
    await updateDoc(rideRef, {
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

    // Add transaction
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
// COMPLETE RIDE
// =============================
completeRideBtn.addEventListener("click", async () => {
  if (!currentRide || !currentRideId) return;

  try {
    // Reload ride for latest payment check
    const rideRef = doc(db, "rides", currentRideId);
    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      alert("Ride not found");
      return;
    }

    const freshRide = rideSnap.data();

    if ((freshRide.paymentStatus || "").toLowerCase() !== "paid") {
      alert("Please confirm payment first");
      return;
    }

    await updateDoc(rideRef, {
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
