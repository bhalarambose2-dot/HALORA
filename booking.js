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
  const pickup = pickupInput.value.trim();
  const drop = dropInput.value.trim();
  const serviceType = (serviceTypeInput.value || "Bike").toLowerCase();

  if (!pickup || !drop) {
    priceInput.value = "";
    return;
  }

  const baseFare = 30;
  let perKm = 10;

  if (serviceType === "bike") perKm = 8;
  if (serviceType === "auto") perKm = 15;
  if (serviceType === "taxi") perKm = 20;

  // Fake distance for now
  const fakeDistance = Math.floor(Math.random() * 10) + 2;
  const total = baseFare + fakeDistance * perKm;

  priceInput.value = total;
}

pickupInput?.addEventListener("input", calculatePrice);
dropInput?.addEventListener("input", calculatePrice);
serviceTypeInput?.addEventListener("change", calculatePrice);

// =======================
// SAVE RIDE BOOKING
// =======================
window.saveRideBooking = async function () {
  const serviceType = serviceTypeInput.value || "Bike";
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
    const rideRef = await addDoc(collection(db, "rides"), {
      userId: user.uid,
      serviceType,
      pickup,
      drop,
      pickupLat: window.userPickupLat || 0,
      pickupLng: window.userPickupLng || 0,
      dropLat: window.userDropLat || 0,
      dropLng: window.userDropLng || 0,
      fare: price,
      paymentMethod: "UPI",
      paymentStatus: "unpaid",
      status: "Pending",
      driverId: "",
      driverName: "",
      driverPhone: "",
      driverLat: 0,
      driverLng: 0,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: Date.now()
    });

    localStorage.setItem("rideId", rideRef.id);

    alert("Ride booked successfully! Waiting for driver...");
    window.location.href = "track-ride.html?rideId=" + rideRef.id;

  } catch (error) {
    alert(error.message);
    console.error("Booking error:", error);
  }
};
