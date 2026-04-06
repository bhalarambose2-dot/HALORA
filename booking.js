// booking.js

import { auth, db } from "./js/firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================
// AUTO PRICE CALCULATION
// =======================
const pickupInput = document.getElementById("pickup");
const dropInput = document.getElementById("drop");
const priceInput = document.getElementById("price");
const serviceTypeInput = document.getElementById("serviceType");

function calculatePrice() {
  if (pickupInput.value && dropInput.value) {
    const baseFare = 50;

    let perKm = 10;
    if (serviceTypeInput.value === "Auto") perKm = 25;
    if (serviceTypeInput.value === "Taxi") perKm = 60;

    const fakeDistance = Math.floor(Math.random() * 10) + 2; // 2–10 km
    const total = baseFare + (fakeDistance * perKm);

    priceInput.value = total;
  }
}

pickupInput.addEventListener("input", calculatePrice);
dropInput.addEventListener("input", calculatePrice);
serviceTypeInput.addEventListener("change", calculatePrice);

// =======================
// SAVE RIDE BOOKING
// =======================
window.saveRideBooking = async function () {
  const serviceType = serviceTypeInput.value;
  const pickup = pickupInput.value.trim();
  const drop = dropInput.value.trim();
  const price = Number(priceInput.value);

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  if (!pickup || !drop || !price) {
    alert("Please fill all booking fields");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "rides"), {
      userId: user.uid,
      serviceType,
      pickup,
      drop,
      pickupLat: window.userPickupLat || 0,
      pickupLng: window.userPickupLng || 0,
      fare: price,
      paymentMethod: "UPI",
      paymentStatus: "unpaid",
      status: "Pending",
      driverId: "",
      createdAt: Date.now()
    });

    // Save ride ID
    localStorage.setItem("rideId", docRef.id);

    alert("Ride booked successfully 🚖");

    // Redirect to tracking
    window.location.href = "track-ride.html?rideId=" + docRef.id;

  } catch (error) {
    alert(error.message);
    console.error("Booking error:", error);
  }
};
