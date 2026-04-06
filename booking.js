import { auth, db } from "./js/firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  doc,
  updateDoc
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

  // 🔥 simple distance logic (improved)
  const distance = Math.floor(Math.random() * 8) + 2;

  const total = baseFare + (distance * perKm);

  priceInput.value = total;
}

// listeners
pickupInput.addEventListener("input", calculatePrice);
dropInput.addEventListener("input", calculatePrice);
serviceTypeInput.addEventListener("change", calculatePrice);

// =======================
// FIND DRIVER (IMPROVED)
// =======================
async function findAvailableDriver() {
  try {
    const q = query(
      collection(db, "drivers"),
      where("online", "==", true),
      where("available", "==", true),
      limit(3) // 🔥 multiple drivers fetch
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // random driver selection (better UX)
    const drivers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return drivers[Math.floor(Math.random() * drivers.length)];

  } catch (error) {
    console.error("Driver find error:", error);
    return null;
  }
}

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
    // 🔥 FIND DRIVER
    const driver = await findAvailableDriver();

    let rideStatus = "Pending";
    let driverId = "";
    let driverName = "";
    let driverPhone = "";

    if (driver) {
      rideStatus = "Driver Assigned";
      driverId = driver.id;
      driverName = driver.name || "HALORA Driver";
      driverPhone = driver.phone || "N/A";
    }

    // 🔥 CREATE RIDE
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
      status: rideStatus,
      driverId,
      driverName,
      driverPhone,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: Date.now()
    });

    // 🔥 UPDATE DRIVER STATUS
    if (driver) {
      await updateDoc(doc(db, "drivers", driver.id), {
        available: false,
        currentRideId: docRef.id
      });
    }

    // 🔥 SAVE RIDE ID
    localStorage.setItem("rideId", docRef.id);

    if (driver) {
      alert(`🚖 Driver Assigned: ${driverName}`);
    } else {
      alert("⏳ Searching for driver...");
    }

    // 🔥 REDIRECT
    window.location.href = "track-ride.html?rideId=" + docRef.id;

  } catch (error) {
    alert(error.message);
    console.error("Booking error:", error);
  }
};
