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

const farePreview = document.getElementById("farePreview");
const distancePreview = document.getElementById("distancePreview");
const etaPreview = document.getElementById("etaPreview");

const setPickupBtn = document.getElementById("setPickupBtn");
const setDropBtn = document.getElementById("setDropBtn");
const useCurrentLocationBtn = document.getElementById("useCurrentLocationBtn");
const clearMapBtn = document.getElementById("clearMapBtn");

const serviceButtons = document.querySelectorAll(".service-btn");

// =======================
// GLOBALS
// =======================
window.userPickupLat = 0;
window.userPickupLng = 0;
window.userDropLat = 0;
window.userDropLng = 0;

let pickupMarker = null;
let dropMarker = null;
let routeLine = null;
let selectingMode = "pickup"; // pickup or drop

// =======================
// MAP INIT
// =======================
const map = L.map("map").setView([26.9124, 75.7873], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// =======================
// SERVICE BUTTONS
// =======================
serviceButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    serviceButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    serviceTypeInput.value = btn.dataset.type;
    calculatePrice();
  });
});

// =======================
// PICKUP / DROP MODE
// =======================
setPickupBtn.addEventListener("click", () => {
  selectingMode = "pickup";
  alert("Now tap on map to set Pickup location");
});

setDropBtn.addEventListener("click", () => {
  selectingMode = "drop";
  alert("Now tap on map to set Drop location");
});

// =======================
// MAP CLICK
// =======================
map.on("click", (e) => {
  const { lat, lng } = e.latlng;

  if (selectingMode === "pickup") {
    window.userPickupLat = lat;
    window.userPickupLng = lng;
    pickupInput.value = `Pickup: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    if (pickupMarker) {
      pickupMarker.setLatLng([lat, lng]);
    } else {
      pickupMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 Pickup").openPopup();
    }
  }

  if (selectingMode === "drop") {
    window.userDropLat = lat;
    window.userDropLng = lng;
    dropInput.value = `Drop: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    if (dropMarker) {
      dropMarker.setLatLng([lat, lng]);
    } else {
      dropMarker = L.marker([lat, lng]).addTo(map).bindPopup("🏁 Drop").openPopup();
    }
  }

  drawRoute();
  calculatePrice();
});

// =======================
// USE CURRENT LOCATION
// =======================
useCurrentLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      window.userPickupLat = lat;
      window.userPickupLng = lng;
      pickupInput.value = `Pickup: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      map.setView([lat, lng], 16);

      if (pickupMarker) {
        pickupMarker.setLatLng([lat, lng]);
      } else {
        pickupMarker = L.marker([lat, lng]).addTo(map).bindPopup("📍 My Pickup").openPopup();
      }

      drawRoute();
      calculatePrice();
    },
    (error) => {
      alert("Location access denied");
      console.error(error);
    },
    { enableHighAccuracy: true }
  );
});

// =======================
// CLEAR MAP
// =======================
clearMapBtn.addEventListener("click", () => {
  pickupInput.value = "";
  dropInput.value = "";
  priceInput.value = "";
  farePreview.innerText = "0";
  distancePreview.innerText = "0";
  etaPreview.innerText = "0";

  window.userPickupLat = 0;
  window.userPickupLng = 0;
  window.userDropLat = 0;
  window.userDropLng = 0;

  if (pickupMarker) {
    map.removeLayer(pickupMarker);
    pickupMarker = null;
  }

  if (dropMarker) {
    map.removeLayer(dropMarker);
    dropMarker = null;
  }

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
});

// =======================
// DRAW ROUTE LINE
// =======================
function drawRoute() {
  if (routeLine) {
    map.removeLayer(routeLine);
  }

  if (
    window.userPickupLat &&
    window.userPickupLng &&
    window.userDropLat &&
    window.userDropLng
  ) {
    const points = [
      [window.userPickupLat, window.userPickupLng],
      [window.userDropLat, window.userDropLng]
    ];

    routeLine = L.polyline(points, {
      weight: 5
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
  }
}

// =======================
// DISTANCE CALCULATION
// =======================
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
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

// =======================
// PRICE CALCULATION
// =======================
function calculatePrice() {
  if (
    !window.userPickupLat ||
    !window.userPickupLng ||
    !window.userDropLat ||
    !window.userDropLng
  ) {
    return;
  }

  const serviceType = (serviceTypeInput.value || "Bike").toLowerCase();

  const distance = getDistanceKm(
    window.userPickupLat,
    window.userPickupLng,
    window.userDropLat,
    window.userDropLng
  );

  let baseFare = 30;
  let perKm = 8;
  let avgSpeed = 25;

  if (serviceType === "bike") {
    baseFare = 30;
    perKm = 8;
    avgSpeed = 28;
  }

  if (serviceType === "auto") {
    baseFare = 40;
    perKm = 12;
    avgSpeed = 22;
  }

  if (serviceType === "taxi") {
    baseFare = 60;
    perKm = 18;
    avgSpeed = 30;
  }

  const total = Math.round(baseFare + distance * perKm);
  const eta = Math.max(5, Math.round((distance / avgSpeed) * 60));

  priceInput.value = total;
  farePreview.innerText = total;
  distancePreview.innerText = distance.toFixed(1);
  etaPreview.innerText = eta;
}

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
    alert("Please set pickup and drop on the map first");
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
