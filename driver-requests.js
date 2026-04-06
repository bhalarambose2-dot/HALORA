// driver-requests.js

import { auth, db } from "./js/firebase-config.js";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const requestsContainer = document.getElementById("requestsContainer");

// ==========================
// AUTH CHECK
// ==========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "./login.html";
    return;
  }

  loadRideRequests(user);
});

// ==========================
// LOAD PENDING RIDES
// ==========================
function loadRideRequests(user) {
  const q = query(
    collection(db, "rides"),
    where("status", "==", "Pending")
  );

  onSnapshot(q, async (snapshot) => {
    requestsContainer.innerHTML = "";

    if (snapshot.empty) {
      requestsContainer.innerHTML = "<p>No ride requests available.</p>";
      return;
    }

    // driver details
    const driverSnap = await getDoc(doc(db, "drivers", user.uid));
    const driverData = driverSnap.exists() ? driverSnap.data() : {};

    snapshot.forEach((docSnap) => {
      const ride = docSnap.data();

      requestsContainer.innerHTML += `
        <div class="request-card">
          <h3>${ride.serviceType || "Ride"} Request</h3>
          <p><strong>Pickup:</strong> ${ride.pickup || "-"}</p>
          <p><strong>Drop:</strong> ${ride.drop || "-"}</p>
          <p><strong>Fare:</strong> ₹${ride.fare || 0}</p>
          <p><strong>Status:</strong> ${ride.status || "Pending"}</p>

          <div class="btn-row">
            <button class="accept-btn" onclick="acceptRide('${docSnap.id}', '${user.uid}', '${driverData.name || "HALORA Driver"}', '${driverData.phone || "N/A"}')">Accept</button>
            <button class="reject-btn" onclick="rejectRide('${docSnap.id}')">Reject</button>
          </div>
        </div>
      `;
    });
  });
}

// ==========================
// ACCEPT RIDE
// ==========================
window.acceptRide = async function (rideId, driverId, driverName, driverPhone) {
  try {
    await updateDoc(doc(db, "rides", rideId), {
      status: "Accepted",
      driverId,
      driverName,
      driverPhone,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      acceptedAt: Date.now()
    });

    await updateDoc(doc(db, "drivers", driverId), {
      available: false,
      currentRideId: rideId
    });

    alert("Ride accepted successfully!");
    window.location.href = "./driver-live.html?rideId=" + rideId;

  } catch (error) {
    alert(error.message);
    console.error("Accept ride error:", error);
  }
};

// ==========================
// REJECT RIDE
// ==========================
window.rejectRide = async function (rideId) {
  try {
    await updateDoc(doc(db, "rides", rideId), {
      status: "Pending"
    });

    alert("Ride rejected");
  } catch (error) {
    alert(error.message);
    console.error("Reject ride error:", error);
  }
};
