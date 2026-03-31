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
let locationWatchId = null;

// Haversine formula for distance (in KM)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Start updating driver location in Firestore
function startDriverLocationUpdates() {
  if (!navigator.geolocation) {
    alert("Location not supported on this device");
    return;
  }

  locationWatchId = navigator.geolocation.watchPosition(async (position) => {
    try {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      await updateDoc(doc(db, "drivers", currentDriverId), {
        lat,
        lng
      });
    } catch (e) {
      console.error("Driver location update failed:", e);
    }
  }, (err) => {
    console.error("Location error:", err);
  }, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000
  });
}

function stopDriverLocationUpdates() {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
  }
}

// Accept Ride
async function acceptRide(rideId) {
  const otp = await generateOTP(rideId);

  await updateDoc(doc(db, "rides", rideId), {
    driverId: currentDriverId,
    status: "accepted"
  });

  alert(`Ride accepted! Customer OTP: ${otp}`);
}

// Reject Ride
async function rejectRide(rideId) {
  await updateDoc(doc(db, "rides", rideId), {
    status: "rejected"
  });

  alert("Ride rejected");
}

// Complete Ride
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

// Main
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
        <p class="muted">Submit verification details and wait for admin approval.</p>
        <a class="secondary-btn" href="documents.html">Open Verification</a>
      </div>
    `;
    return;
  }

  const toggle = document.getElementById("onlineToggle");
  toggle.checked = !!driver.online;

  // If already online from previous session, restart location tracking
  if (toggle.checked) {
    startDriverLocationUpdates();
  }

  toggle.addEventListener("change", async () => {
    await updateDoc(driverRef, { online: toggle.checked });

    if (toggle.checked) {
      startDriverLocationUpdates();
    } else {
      stopDriverLocationUpdates();
    }
  });

  // Show only nearby pending rides
  const pendingQ = query(
    collection(db, "rides"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(pendingQ, async (snap) => {
    const box = document.getElementById("pendingRides");

    const latestDriverSnap = await getDoc(driverRef);
    const latestDriver = latestDriverSnap.data();

    const driverLat = latestDriver.lat;
    const driverLng = latestDriver.lng;
    const isOnline = latestDriver.online;

    if (!isOnline) {
      box.innerHTML = "Go online to receive rides";
      return;
    }

    if (!driverLat || !driverLng) {
      box.innerHTML = "Waiting for your GPS location...";
      return;
    }

    if (snap.empty) {
      box.innerHTML = "No pending rides";
      return;
    }

    box.innerHTML = "";
    let foundNearbyRide = false;

    snap.forEach((rideDoc) => {
      const ride = rideDoc.data();

      if (!ride.customerLat || !ride.customerLng) return;

      const distance = getDistance(
        driverLat,
        driverLng,
        ride.customerLat,
        ride.customerLng
      );

      // Only show rides within 5 KM
      if (distance <= 5) {
        foundNearbyRide = true;

        box.innerHTML += `
          <div class="ride-request-card">
            <h3>${ride.pickup} → ${ride.drop}</h3>
            <p>Fare: ${currency(ride.fare)}</p>
            <p>Distance: ${distance.toFixed(2)} km</p>
            <p>Status: ${statusBadge(ride.status)}</p>
            <div class="row">
              <button class="main-btn" onclick="acceptRide('${rideDoc.id}')">Accept</button>
              <button class="danger-btn" onclick="rejectRide('${rideDoc.id}')">Reject</button>
            </div>
          </div>
        `;
      }
    });

    if (!foundNearbyRide) {
      box.innerHTML = "No nearby rides within 5 KM";
    }
  });

  // Active Ride listener
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

  // Cleanup on tab close / refresh
  window.addEventListener("beforeunload", () => {
    stopDriverLocationUpdates();
  });
});
