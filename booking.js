// booking.js

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
    if (serviceTypeInput.value === "bike") parkm = 8
    const fakeDistance = Math.floor(Math.random() * 10) + 2;
    const total = baseFare + (fakeDistance * perKm);

    priceInput.value = total;
  }
}

pickupInput.addEventListener("input", calculatePrice);
dropInput.addEventListener("input", calculatePrice);
serviceTypeInput.addEventListener("change", calculatePrice);

// =======================
// FIND AVAILABLE DRIVER
// =======================
async function findAvailableDriver() {
  try {
    const q = query(
      collection(db, "drivers"),
      where("online", "==", true),
      where("available", "==", true),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const driverDoc = snapshot.docs[0];
    return {
      id: driverDoc.id,
      ...driverDoc.data()
    };
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
    // 1. Find driver
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

    // 2. Create ride
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

    // 3. Mark driver unavailable
    if (driver) {
      await updateDoc(doc(db, "drivers", driver.id), {
        available: false,
        currentRideId: docRef.id
      });
    }

    // 4. Save ride ID
    localStorage.setItem("rideId", docRef.id);

    if (driver) {
      alert(`Driver assigned: ${driverName}`);
    } else {
      alert("Ride booked. Waiting for driver...");
    }

    // 5. Redirect
    window.location.href = "track-ride.html?rideId=" + docRef.id;

  } catch (error) {
    alert(error.message);
    console.error("Booking error:", error);
  }
};
