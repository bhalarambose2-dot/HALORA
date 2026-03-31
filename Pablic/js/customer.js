import { auth, db } from "./firebase-config.js";
import { guardPage, bindLogout, setText, statusBadge } from "./common.js";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let selectedFare = 49;

window.selectVehicle = function (card) {
  document.querySelectorAll(".vehicle-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedFare = Number(card.dataset.fare || 49);
};

window.bookRide = async function () {
  const pickup = document.getElementById("pickup").value.trim();
  const drop = document.getElementById("drop").value.trim();
  const user = auth.currentUser;

  if (!pickup || !drop) {
    alert("Please enter pickup and drop");
    return;
  }

  try {
    const rideRef = await addDoc(collection(db, "rides"), {
      customerId: user.uid,
      driverId: "",
      pickup,
      drop,
      fare: selectedFare,
      status: "pending",
      otp: null,
      rating: null,
      review: "",
      driverLat: null,
      driverLng: null,
      createdAt: serverTimestamp()
    });

    localStorage.setItem("rideId", rideRef.id);
    alert("Ride requested! Driver will see it now.");
    window.location.href = "ride-live.html";
  } catch (e) {
    alert(e.message);
  }
};

guardPage(async (user) => {
  bindLogout();

  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists()) {
    alert("Customer profile not found");
    window.location.href = "login.html";
    return;
  }

  const data = userSnap.data();
  setText("customerName", data.name || "Customer");
  setText("customerEmail", data.email || "");

  const q = query(
    collection(db, "rides"),
    where("customerId", "==", user.uid),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  onSnapshot(q, (snap) => {
    if (snap.empty) {
      document.getElementById("lastRideStatus").innerHTML = "No ride yet";
      return;
    }
    const rideDoc = snap.docs[0];
    const ride = rideDoc.data();
    localStorage.setItem("rideId", rideDoc.id);
    document.getElementById("lastRideStatus").innerHTML = `
      <div class="mini-card">
        <h3>${ride.pickup} → ${ride.drop}</h3>
        <p>Fare: ₹${ride.fare}</p>
        <p>Status: ${statusBadge(ride.status)}</p>
      </div>
    `;
  });
});
