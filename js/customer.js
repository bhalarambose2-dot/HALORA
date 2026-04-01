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
let selectedPaymentMethod = "UPI";

// Vehicle select
window.selectVehicle = function (card) {
  document.querySelectorAll(".vehicle-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedFare = Number(card.dataset.fare || 49);
};

// Payment method select
window.selectPayment = function (method) {
  selectedPaymentMethod = method;
  document.getElementById("paymentMethodText").innerText = method;
};

// Book Ride with customer live location + payment method
window.bookRide = async function () {
  const pickup = document.getElementById("pickup").value.trim();
  const drop = document.getElementById("drop").value.trim();
  const user = auth.currentUser;

  if (!pickup || !drop) {
    alert("Please enter pickup and drop");
    return;
  }

  if (!navigator.geolocation) {
    alert("Location not supported on this device");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const paymentStatus = selectedPaymentMethod === "Cash" ? "cash" : "unpaid";

      const rideRef = await addDoc(collection(db, "rides"), {
        customerId: user.uid,
        driverId: "",
        pickup,
        drop,
        fare: selectedFare,
        status: "pending",
        paymentStatus: paymentStatus,
        paymentMethod: selectedPaymentMethod,
        otp: null,
        rating: null,
        review: "",
        walletCredited: false,
        customerLat: lat,
        customerLng: lng,
        driverLat: null,
        driverLng: null,
        createdAt: serverTimestamp()
      });

      localStorage.setItem("rideId", rideRef.id);
      alert(`Ride requested with ${selectedPaymentMethod} payment!`);
      window.location.href = "ride-live.html";
    } catch (e) {
      alert(e.message);
    }
  }, (err) => {
    alert("Location permission denied. Please allow location.");
    console.error(err);
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
};

// Auth Guard
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
        <p>Payment Method: <b>${ride.paymentMethod || "UPI"}</b></p>
        <p>Payment: <b>${ride.paymentStatus || "unpaid"}</b></p>
      </div>
    `;
  });
});
