// booking.js

import { auth, db } from "./js/firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =======================
// ELEMENTS
// =======================
const pickupInput = document.getElementById("pickup");
const dropInput = document.getElementById("drop");
const priceInput = document.getElementById("price");
const serviceTypeInput = document.getElementById("serviceType");

// =======================
// AUTO PRICE CALCULATION
// =======================
function calculatePrice() {
  if (!pickupInput.value || !dropInput.value) return;

  let baseFare = 30;
  let perKm = 10;

  if (serviceTypeInput.value === "Bike") {
    baseFare = 20;
    perKm = 8;
  }

  if (serviceTypeInput.value === "Auto") {
    baseFare = 40;
    perKm = 15;
  }

  if (serviceTypeInput.value === "Taxi") {
    baseFare = 80;
    perKm = 25;
  }

  const distance = Math.floor(Math.random() * 8) + 2;
  const total = baseFare + (distance * perKm);

  priceInput.value = total;
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

      // payment
      paymentMethod: "UPI",
      paymentStatus: "unpaid",

      // driver flow
      status: "Pending",
      driverId: "",
      driverName: "",
      driverPhone: "",
      otp: "",

      createdAt: Date.now()
    });

    localStorage.setItem("rideId", docRef.id);

    alert("Ride booked successfully! Waiting for driver acceptance...");
    window.location.href = "track-ride.html?rideId=" + docRef.id;

  } catch (error) {
    alert(error.message);
    console.error("Booking error:", error);
  }
};
