import { db } from "./firebase-config.js";
import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let watchId = null;

export function startDriverTracking(rideId) {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(async (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    await updateDoc(doc(db, "rides", rideId), {
      driverLat: lat,
      driverLng: lng
    });
  }, console.error, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000
  });
}

export function stopDriverTracking() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
}
