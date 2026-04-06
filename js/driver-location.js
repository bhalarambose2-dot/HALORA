// js/driver-location.js

import { auth, db } from "./firebase-config.js";
import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let watchId = null;

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  window.startDriverTracking = function () {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          await updateDoc(doc(db, "drivers", user.uid), {
            location: { lat, lng },
            lastLocationUpdate: Date.now()
          });

          console.log("Driver location updated:", lat, lng);
        } catch (error) {
          console.error("Location update error:", error);
        }
      },
      (error) => {
        console.error("GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  };

  window.stopDriverTracking = function () {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      console.log("Driver tracking stopped");
    }
  };
});
