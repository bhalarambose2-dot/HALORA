// js/ride-live.js

import { auth, db } from "./firebase-config.js";
import {
  doc,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  initMap,
  updateDriverMarker,
  setPickupMarker,
  setDropMarker,
  drawSimpleRoute,
  focusMap
} from "./map.js";

import {
  calculateDistanceKm,
  estimateETA
} from "./eta.js";

const rideStatus = document.getElementById("rideStatus");
const driverNameEl = document.getElementById("driverName");
const etaText = document.getElementById("etaText");
const pickupText = document.getElementById("pickupText");
const dropText = document.getElementById("dropText");

// URL example: ride-live.html?bookingId=BOOKING_ID
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("bookingId");

let map;

if (!bookingId) {
  alert("Booking ID missing");
  throw new Error("Booking ID missing");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  map = initMap();

  const bookingRef = doc(db, "bookings", bookingId);

  onSnapshot(bookingRef, async (bookingSnap) => {
    if (!bookingSnap.exists()) {
      alert("Booking not found");
      return;
    }

    const booking = bookingSnap.data();

    rideStatus.textContent = booking.status || "Pending";
    driverNameEl.textContent = booking.driverName || "Not assigned";
    pickupText.textContent = booking.pickup || "-";
    dropText.textContent = booking.drop || "-";

    // Pickup/Drop coordinates
    const pickupPos = booking.pickupLocation || { lat: 26.9124, lng: 75.7873 };
    const dropPos = booking.dropLocation || { lat: 26.9239, lng: 75.8267 };

    setPickupMarker(pickupPos);
    setDropMarker(dropPos);

    // Driver tracking
    if (booking.driverId) {
      const driverRef = doc(db, "drivers", booking.driverId);

      onSnapshot(driverRef, (driverSnap) => {
        if (!driverSnap.exists()) return;

        const driver = driverSnap.data();
        const driverPos = driver.location || pickupPos;

        updateDriverMarker(driverPos, booking.driverName || "Driver");
        drawSimpleRoute(driverPos, pickupPos, dropPos);
        focusMap(driverPos);

        const distance = calculateDistanceKm(
          driverPos.lat,
          driverPos.lng,
          pickupPos.lat,
          pickupPos.lng
        );

        const eta = estimateETA(distance);
        etaText.textContent = `${eta} min away`;
      });
    } else {
      etaText.textContent = "Waiting for driver";
      focusMap(pickupPos);
    }
  });
});
