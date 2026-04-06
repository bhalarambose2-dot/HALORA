import { auth, db } from "./js/firebase-config.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const requestsDiv = document.getElementById("requests");

let currentUser = null;

// ==========================
// LISTEN FOR BOOKINGS
// ==========================
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  currentUser = user;

  const q = query(
    collection(db, "bookings"),
    where("driverId", "==", user.uid),
    where("status", "==", "Driver Assigned")
  );

  onSnapshot(q, (snapshot) => {
    requestsDiv.innerHTML = "";

    if (snapshot.empty) {
      requestsDiv.innerHTML = "<p>No new requests</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const b = docSnap.data();

      requestsDiv.innerHTML += `
        <div class="card">
          <h3>${b.pickup} → ${b.drop}</h3>
          <p>₹${b.amount}</p>

          <button class="accept" onclick="acceptRide('${docSnap.id}')">Accept</button>
          <button class="reject" onclick="rejectRide('${docSnap.id}')">Reject</button>
        </div>
      `;
    });
  });
});

// ==========================
// ACCEPT RIDE
// ==========================
window.acceptRide = async function (id) {
  try {
    await updateDoc(doc(db, "bookings", id), {
      status: "Accepted",
      acceptedAt: Date.now()
    });

    alert("Ride accepted");
  } catch (error) {
    alert(error.message);
  }
};

// ==========================
// REJECT RIDE
// ==========================
window.rejectRide = async function (id) {
  try {
    await updateDoc(doc(db, "bookings", id), {
      status: "Pending",
      driverId: null
    });

    alert("Ride rejected - finding next driver");

    // OPTIONAL: reassign logic trigger
  } catch (error) {
    alert(error.message);
  }
};
