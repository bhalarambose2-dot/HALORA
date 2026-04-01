import { firebaseConfig } from './firebase-config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let riderId = "";

auth.onAuthStateChanged((user) => {
  if (user) {
    riderId = user.uid;
    startTracking();
  }
});

function startTracking() {
  navigator.geolocation.watchPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    await set(ref(db, 'liveLocations/' + riderId), {
      lat,
      lng,
      time: Date.now()
    });
  });
}
