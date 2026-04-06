// js/driver-assign.js

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Distance formula (simple)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// MAIN FUNCTION
export async function assignNearestDriver(bookingId, pickupLat, pickupLng) {
  try {
    const driversSnap = await getDocs(collection(db, "drivers"));

    let nearestDriver = null;
    let minDistance = Infinity;

    driversSnap.forEach((docSnap) => {
      const driver = docSnap.data();

      if (
        driver.online === true &&
        driver.available === true &&
        driver.location &&
        driver.location.lat &&
        driver.location.lng
      ) {
        const distance = calculateDistance(
          pickupLat,
          pickupLng,
          driver.location.lat,
          driver.location.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestDriver = {
            id: docSnap.id,
            ...driver
          };
        }
      }
    });

    if (!nearestDriver) {
      alert("No driver available right now");
      return null;
    }

    // Update booking
    await updateDoc(doc(db, "bookings", bookingId), {
      driverId: nearestDriver.id,
      driverName: nearestDriver.name || "Driver",
      driverPhone: nearestDriver.phone || "",
      status: "Driver Assigned",
      assignedAt: Date.now()
    });

    // Mark driver busy
    await updateDoc(doc(db, "drivers", nearestDriver.id), {
      available: false,
      currentBookingId: bookingId
    });

    return nearestDriver;

  } catch (error) {
    console.error("Driver assign error:", error);
    alert(error.message);
    return null;
  }
}
