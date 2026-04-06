// js/driver-panel.js

import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// =============================
// ELEMENTS
// =============================
const driverRequestsList = document.getElementById("driverRequestsList");
const driverStatusText = document.getElementById("driverStatusText");
const onlineToggle = document.getElementById("onlineToggle");

const rideRoute = document.getElementById("rideRoute");
const rideCustomer = document.getElementById("rideCustomer");
const rideFare = document.getElementById("rideFare");
const rideOtp = document.getElementById("rideOtp");
const rideStatusText = document.getElementById("rideStatusText");

const todayEarningsEl = document.getElementById("todayEarnings");
const driverEarningsEl = document.getElementById("driverEarnings");
const rideCountEl = document.getElementById("rideCount");

let currentUser = null;
let currentRideId = null;
let currentRide = null;

// MAP
let map = null;
let driverMarker = null;
let pickupMarker = null;
let dropMarker = null;
let routeLine = null;
let driverLat = 0;
let driverLng = 0;

const driverIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [40, 40]
});

// =============================
// AUTH
// =============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  await ensureDriverWallet();
  await ensureDriverDoc();
  await loadDriverStatus();
  await loadTodayEarnings();
  listenIncomingRequests();
  listenCurrentRide();
  startLiveTracking();
});

// =============================
// ENSURE DRIVER DOC
// =============================
async function ensureDriverDoc() {
  const driverRef = doc(db, "drivers", currentUser.uid);
  const snap = await getDoc(driverRef);

  if (!snap.exists()) {
    await setDoc(driverRef, {
      uid: currentUser.uid,
      name: auth.currentUser.displayName || "HALORA Driver",
      phone: auth.currentUser.phoneNumber || "N/A",
      online: false,
      available: true,
      currentRideId: null,
      createdAt: Date.now()
    });
  }
}

// =============================
// ENSURE DRIVER WALLET
// =============================
async function ensureDriverWallet() {
  const walletRef = doc(db, "wallets", currentUser.uid);
  const snap = await getDoc(walletRef);

  if (!snap.exists()) {
    await setDoc(walletRef, {
      uid: currentUser.uid,
      balance: 0,
      role: "driver",
      createdAt: Date.now()
    });
  }
}

// =============================
// LOAD ONLINE STATUS
// =============================
async function loadDriverStatus() {
  const driverRef = doc(db, "drivers", currentUser.uid);
  const snap = await getDoc(driverRef);

  if (snap.exists()) {
    const data = snap.data();
    onlineToggle.checked = data.online || false;
    driverStatusText.innerText = data.online ? "Online" : "Offline";
  }
}

// =============================
// TOGGLE ONLINE/OFFLINE
// =============================
onlineToggle?.addEventListener("change", async () => {
  try {
    await updateDoc(doc(db, "drivers", currentUser.uid), {
      online: onlineToggle.checked,
      available: onlineToggle.checked
    });

    driverStatusText.innerText = onlineToggle.checked ? "Online" : "Offline";
  } catch (error) {
    alert(error.message);
  }
});

// =============================
// LOAD TODAY + TOTAL EARNINGS
// =============================
async function loadTodayEarnings() {
  try {
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", currentUser.uid),
      where("type", "==", "Driver Earning")
    );

    const snap = await getDocs(q);

    let todayTotal = 0;
    let grandTotal = 0;
    let rides = 0;
    const today = new Date().toDateString();

    snap.forEach((docSnap) => {
      const t = docSnap.data();
      grandTotal += Number(t.amount || 0);
      rides += 1;

      const d = new Date(t.createdAt || Date.now()).toDateString();
      if (d === today) {
        todayTotal += Number(t.amount || 0);
      }
    });

    todayEarningsEl.textContent = todayTotal;
    driverEarningsEl.textContent = grandTotal;
    rideCountEl.textContent = rides;
  } catch (error) {
    console.error("Earnings load error:", error);
  }
}

// =============================
// INCOMING REQUESTS
// =============================
function listenIncomingRequests() {
  const q = query(collection(db, "rides"), where("status", "==", "Pending"));

  onSnapshot(q, async (snapshot) => {
    driverRequestsList.innerHTML = "";

    // Show only if driver is online
    const driverSnap = await getDoc(doc(db, "drivers", currentUser.uid));
    const isOnline = driverSnap.exists() ? !!driverSnap.data().online : false;

    if (!isOnline) {
      driverRequestsList.innerHTML = "<p>Go online to receive requests</p>";
      return;
    }

    if (snapshot.empty) {
      driverRequestsList.innerHTML = "<p>No incoming requests</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const ride = docSnap.data();

      driverRequestsList.innerHTML += `
        <div class="admin-card">
          <p><strong>${ride.pickup || "-"}</strong> → <strong>${ride.drop || "-"}</strong></p>
          <p>Service: ${ride.serviceType || "Ride"}</p>
          <p>Fare: ₹${ride.fare || 0}</p>
          <div class="driver-action-grid">
            <button class="accept-btn" onclick="acceptRide('${docSnap.id}')">Accept</button>
            <button class="secondary-btn" onclick="rejectRide('${docSnap.id}')">Reject</button>
          </div>
        </div>
      `;
    });
  });
}

// =============================
// ACCEPT RIDE
// =============================
window.acceptRide = async function (rideId) {
  try {
    const rideRef = doc(db, "rides", rideId);
    const rideSnap = await getDoc(rideRef);

    if (!rideSnap.exists()) {
      alert("Ride not found");
      return;
    }

    const rideData = rideSnap.data();
    if (rideData.status !== "Pending") {
      alert("This ride is already taken.");
      return;
    }

    const driverRef = doc(db, "drivers", currentUser.uid);
    const driverSnap = await getDoc(driverRef);
    const driver = driverSnap.data() || {};

    await updateDoc(rideRef, {
      status: "Accepted",
      driverId: currentUser.uid,
      driverName: driver.name || "HALORA Driver",
      driverPhone: driver.phone || "N/A",
      acceptedAt: Date.now()
    });

    await updateDoc(driverRef, {
      available: false,
      currentRideId: rideId
    });

    currentRideId = rideId;
    alert("Ride accepted successfully!");
  } catch (error) {
    alert(error.message);
    console.error("Accept ride error:", error);
  }
};

// =============================
// REJECT RIDE (simple)
// =============================
window.rejectRide = async function (rideId) {
  alert("Ride rejected");
};

// =============================
// LISTEN CURRENT RIDE
// =============================
function listenCurrentRide() {
  const q = query(
    collection(db, "rides"),
    where("driverId", "==", currentUser.uid)
  );

  onSnapshot(q, (snapshot) => {
    let found = false;

    snapshot.forEach((docSnap) => {
      const ride = docSnap.data();

      if (["Accepted", "Started"].includes(ride.status)) {
        found = true;
        currentRideId = docSnap.id;
        currentRide = ride;

        rideRoute.innerText = `${ride.pickup || "-"} → ${ride.drop || "-"}`;
        rideCustomer.innerText = `Customer: ${ride.userId || "--"}`;
        rideFare.innerText = `Fare: ₹${ride.fare || 0}`;
        rideOtp.innerText = `OTP: ${ride.otp || "----"}`;
        rideStatusText.innerText = `Status: ${ride.status || "--"}`;

        setTimeout(() => {
          refreshDriverLocation();
        }, 1000);
      }
    });

    if (!found) {
      rideRoute.innerText = "No active ride";
      rideCustomer.innerText = "Customer: --";
      rideFare.innerText = "Fare: ₹0";
      rideOtp.innerText = "OTP: ----";
      rideStatusText.innerText = "Status: --";
      currentRideId = null;
      currentRide = null;
    }
  });
}

// =============================
// START RIDE (OTP verify)
// =============================
window.startRide = async function () {
  if (!currentRide || !currentRideId) {
    alert("No active ride");
    return;
  }

  const enteredOtp = prompt("Enter customer OTP");

  if (!enteredOtp) return;

  if (enteredOtp !== String(currentRide.otp)) {
    alert("Invalid OTP");
    return;
  }

  try {
    await updateDoc(doc(db, "rides", currentRideId), {
      status: "Started",
      startedAt: Date.now()
    });

    alert("Ride started successfully");
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// COMPLETE RIDE
// =============================
window.completeRide = async function () {
  if (!currentRide || !currentRideId) {
    alert("No active ride");
    return;
  }

  try {
    await updateDoc(doc(db, "rides", currentRideId), {
      status: "Completed",
      completedAt: Date.now()
    });

    await updateDoc(doc(db, "drivers", currentUser.uid), {
      available: true,
      currentRideId: null
    });

    // Auto earning entry (simple)
    const fare = Number(currentRide.fare || 0);
    const driverEarning = Math.round(fare * 0.85);

    // Wallet
    const walletRef = doc(db, "wallets", currentUser.uid);
    const walletSnap = await getDoc(walletRef);
    const currentBalance = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;

    await updateDoc(walletRef, {
      balance: currentBalance + driverEarning
    });

    // Transaction
    await addDoc(collection(db, "transactions"), {
      uid: currentUser.uid,
      type: "Driver Earning",
      amount: driverEarning,
      rideId: currentRideId,
      status: "Success",
      createdAt: Date.now()
    });

    alert(`Ride completed. ₹${driverEarning} added to wallet.`);
    loadTodayEarnings();
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// WITHDRAW
// =============================
window.withdrawNow = async function () {
  const amount = Number(document.getElementById("withdrawAmount")?.value || 0);

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  alert("Withdraw request submitted!");
};

// =============================
// INIT MAP
// =============================
function initMap() {
  if (map) return;

  map = L.map("driverMap").setView([26.9124, 75.7873], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

// =============================
// DRIVER LIVE LOCATION (manual)
// =============================
window.refreshDriverLocation = async function () {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      driverLat = position.coords.latitude;
      driverLng = position.coords.longitude;

      // Save driver live location in Firestore
      if (currentUser) {
        try {
          await updateDoc(doc(db, "drivers", currentUser.uid), {
            driverLat,
            driverLng,
            updatedAt: Date.now()
          });

          // ALSO update in ride (IMPORTANT)
          if (currentRideId) {
            await updateDoc(doc(db, "rides", currentRideId), {
              driverLat,
              driverLng
            });
          }
        } catch (e) {
          console.error("Driver location save error:", e);
        }
      }

      updateDriverMap();
    },
    (error) => {
      alert("Location access denied");
      console.error(error);
    },
    { enableHighAccuracy: true }
  );
};

// =============================
// LIVE LOCATION AUTO UPDATE
// =============================
function startLiveTracking() {
  if (!navigator.geolocation) return;

  setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        driverLat = position.coords.latitude;
        driverLng = position.coords.longitude;

        try {
          await updateDoc(doc(db, "drivers", currentUser.uid), {
            driverLat,
            driverLng,
            updatedAt: Date.now()
          });

          // ALSO update in ride (IMPORTANT)
          if (currentRideId) {
            await updateDoc(doc(db, "rides", currentRideId), {
              driverLat,
              driverLng
            });
          }

          updateDriverMap();
        } catch (e) {
          console.error("Live location error:", e);
        }
      },
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
  }, 5000); // every 5 seconds
}

// =============================
// UPDATE DRIVER MAP
// =============================
function updateDriverMap() {
  if (!currentRide) return;

  initMap();

  const pickupLat = currentRide.pickupLat || 0;
  const pickupLng = currentRide.pickupLng || 0;
  const dropLat = currentRide.dropLat || 0;
  const dropLng = currentRide.dropLng || 0;

  // Driver Marker
  if (driverLat && driverLng) {
    const driverPos = [driverLat, driverLng];

    if (!driverMarker) {
      driverMarker = L.marker(driverPos, { icon: driverIcon }).addTo(map).bindPopup("🚖 You");
    } else {
      driverMarker.setLatLng(driverPos);
    }
  }

  // Pickup Marker
  if (pickupLat && pickupLng) {
    const pickupPos = [pickupLat, pickupLng];

    if (!pickupMarker) {
      pickupMarker = L.marker(pickupPos).addTo(map).bindPopup("📍 Pickup");
    } else {
      pickupMarker.setLatLng(pickupPos);
    }
  }

  // Drop Marker
  if (dropLat && dropLng) {
    const dropPos = [dropLat, dropLng];

    if (!dropMarker) {
      dropMarker = L.marker(dropPos).addTo(map).bindPopup("🏁 Drop");
    } else {
      dropMarker.setLatLng(dropPos);
    }
  }

  // Route line
  const routePoints = [];

  if (driverLat && driverLng) routePoints.push([driverLat, driverLng]);
  if (pickupLat && pickupLng) routePoints.push([pickupLat, pickupLng]);
  if (dropLat && dropLng) routePoints.push([dropLat, dropLng]);

  if (routeLine) {
    map.removeLayer(routeLine);
  }

  if (routePoints.length >= 2) {
    routeLine = L.polyline(routePoints, {
      weight: 5
    }).addTo(map);

    map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
  }
}

// =============================
// GOOGLE MAPS NAVIGATION
// =============================
window.openGoogleMaps = function () {
  if (!currentRide) {
    alert("No active ride");
    return;
  }

  const pickupLat = currentRide.pickupLat || 0;
  const pickupLng = currentRide.pickupLng || 0;

  if (!pickupLat || !pickupLng) {
    alert("Pickup location not found");
    return;
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pickupLat},${pickupLng}&travelmode=driving`;
  window.open(googleMapsUrl, "_blank");
};
