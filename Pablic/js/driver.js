import { auth, db } from "./firebase-config.js";
import { guardPage, bindLogout, setText, currency, statusBadge } from "./common.js";
import { generateOTP, verifyOTP } from "./otp.js";
import { startDriverTracking, stopDriverTracking } from "./map.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentDriverId = null;

async function acceptRide(rideId) {
  const otp = await generateOTP(rideId);
  await updateDoc(doc(db, "rides", rideId), {
    driverId: currentDriverId,
    status: "accepted"
  });
  alert(`Ride accepted! Customer OTP: ${otp}`);
}

async function rejectRide(rideId) {
  await updateDoc(doc(db, "rides", rideId), {
    status: "rejected"
  });
  alert("Ride rejected");
}

async function completeRide(rideId, fare) {
  const driverRef = doc(db, "drivers", currentDriverId);
  const driverSnap = await getDoc(driverRef);
  const driver = driverSnap.data();

  const newEarnings = Number(driver.earnings || 0) + Number(fare || 0);
  const newWallet = Number(driver.wallet || 0) + Number(fare || 0);

  await updateDoc(doc(db, "rides", rideId), { status: "completed" });
  await updateDoc(driverRef, {
    earnings: newEarnings,
    wallet: newWallet
  });

  stopDriverTracking();
  alert("Ride completed!");
}

window.acceptRide = acceptRide;
window.rejectRide = rejectRide;
window.completeRide = completeRide;

guardPage(async (user) => {
  bindLogout();
  currentDriverId = user.uid;

  const driverRef = doc(db, "drivers", user.uid);
  const driverSnap = await getDoc(driverRef);

  if (!driverSnap.exists()) {
    alert("Driver profile not found");
    window.location.href = "login.html";
    return;
  }

  const driver = driverSnap.data();
  setText("driverInfo", `${driver.name || "Driver"} • ${driver.email || ""}`);
  setText("todayEarnings", currency(driver.earnings || 0));
  setText("driverWallet", currency(driver.wallet || 0));

  if (!driver.approved) {
    document.getElementById("pendingRides").innerHTML = `
      <div class="mini-card">
        <h3>Approval Pending</h3>
        <p class="muted">Upload documents and wait for admin approval.</p>
        <a class="secondary-btn" href="documents.html">Upload Documents</a>
      </div>
    `;
    return;
  }

  const toggle = document.getElementById("onlineToggle");
  toggle.checked = !!driver.online;

  toggle.addEventListener("change", async () => {
    await updateDoc(driverRef, { online: toggle.checked });
  });

  const pendingQ = query(
    collection(db, "rides"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(pendingQ, (snap) => {
    const box = document.getElementById("pendingRides");
    if (snap.empty) {
      box.innerHTML = "No pending rides";
      return;
    }

    box.innerHTML = "";
    snap.forEach((rideDoc) => {
      const ride = rideDoc.data();
      box.innerHTML += `
        <div class="ride-request-card">
          <h3>${ride.pickup} → ${ride.drop}</h3>
          <p>Fare: ${currency(ride.fare)}</p>
          <p>Status: ${statusBadge(ride.status)}</p>
          <div class="row">
            <button class="main-btn" onclick="acceptRide('${rideDoc.id}')">Accept</button>
            <button class="danger-btn" onclick="rejectRide('${rideDoc.id}')">Reject</button>
          </div>
        </div>
      `;
    });
  });

  const activeQ = query(
    collection(db, "rides"),
    where("driverId", "==", user.uid)
  );

  onSnapshot(activeQ, (snap) => {
    const active = document.getElementById("activeRide");
    if (snap.empty) {
      active.innerHTML = "No active ride";
      return;
    }

    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const ride = docs.find(r => ["accepted", "started"].includes(r.status)) || docs[0];

    if (!ride) {
      active.innerHTML = "No active ride";
      return;
    }

    if (ride.status === "accepted") {
      startDriverTracking(ride.id);
    }

    active.innerHTML = `
      <div class="mini-card">
        <h3>${ride.pickup} → ${ride.drop}</h3>
        <p>Fare: ${currency(ride.fare)}</p>
        <p>Status: ${statusBadge(ride.status)}</p>
        <input id="otpInput" type="number" placeholder="Enter customer OTP to start ride" />
        <button class="secondary-btn" id="startRideBtn">Start Ride</button>
        <button class="main-btn" id="completeRideBtn">Complete Ride</button>
      </div>
    `;

    document.getElementById("startRideBtn").onclick = async () => {
      const entered = document.getElementById("otpInput").value;
      const ok = await verifyOTP(ride.id, entered);
      if (ok) {
        alert("Ride started!");
      } else {
        alert("Wrong OTP");
      }
    };

    document.getElementById("completeRideBtn").onclick = async () => {
      await completeRide(ride.id, ride.fare);
    };
  });
});
