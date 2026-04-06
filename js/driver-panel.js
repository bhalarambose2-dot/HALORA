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

const driverRequestsList = document.getElementById("driverRequestsList");
const driverStatusText = document.getElementById("driverStatusText");
const onlineToggle = document.getElementById("onlineToggle");

const rideRoute = document.getElementById("rideRoute");
const rideCustomer = document.getElementById("rideCustomer");
const rideFare = document.getElementById("rideFare");
const rideOtp = document.getElementById("rideOtp");

const todayEarningsEl = document.getElementById("todayEarnings");
const driverEarningsEl = document.getElementById("driverEarnings");
const rideCountEl = document.getElementById("rideCount");

let currentUser = null;
let currentRideId = null;
let currentRide = null;

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

async function loadDriverStatus() {
  const snap = await getDoc(doc(db, "drivers", currentUser.uid));
  if (snap.exists()) {
    const data = snap.data();
    onlineToggle.checked = data.online || false;
    driverStatusText.innerText = data.online ? "Online" : "Offline";
  }
}

onlineToggle?.addEventListener("change", async () => {
  await updateDoc(doc(db, "drivers", currentUser.uid), {
    online: onlineToggle.checked,
    available: onlineToggle.checked
  });
  driverStatusText.innerText = onlineToggle.checked ? "Online" : "Offline";
});

async function loadTodayEarnings() {
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
    if (d === today) todayTotal += Number(t.amount || 0);
  });

  todayEarningsEl.textContent = todayTotal;
  driverEarningsEl.textContent = grandTotal;
  rideCountEl.textContent = rides;
}

function listenIncomingRequests() {
  const q = query(collection(db, "rides"), where("status", "==", "Pending"));

  onSnapshot(q, (snapshot) => {
    driverRequestsList.innerHTML = "";

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
          <button class="accept-btn" onclick="acceptRide('${docSnap.id}')">Accept Ride</button>
        </div>
      `;
    });
  });
}

window.acceptRide = async function (rideId) {
  const rideRef = doc(db, "rides", rideId);
  const rideSnap = await getDoc(rideRef);

  if (!rideSnap.exists()) {
    alert("Ride not found");
    return;
  }

  const driverSnap = await getDoc(doc(db, "drivers", currentUser.uid));
  const driver = driverSnap.data() || {};

  await updateDoc(rideRef, {
    status: "Accepted",
    driverId: currentUser.uid,
    driverName: driver.name || "HALORA Driver",
    driverPhone: driver.phone || "N/A",
    acceptedAt: Date.now()
  });

  await updateDoc(doc(db, "drivers", currentUser.uid), {
    available: false,
    currentRideId: rideId
  });

  currentRideId = rideId;
  alert("Ride accepted!");
};

function listenCurrentRide() {
  const q = query(collection(db, "rides"), where("driverId", "==", currentUser.uid));

  onSnapshot(q, (snapshot) => {
    snapshot.forEach((docSnap) => {
      const ride = docSnap.data();

      if (["Accepted", "Started"].includes(ride.status)) {
        currentRideId = docSnap.id;
        currentRide = ride;

        rideRoute.innerText = `${ride.pickup || "-"} → ${ride.drop || "-"}`;
        rideCustomer.innerText = `Customer: ${ride.userId || "--"}`;
        rideFare.innerText = `Fare: ₹${ride.fare || 0}`;
        rideOtp.innerText = `OTP: ${ride.otp || "----"}`;
      }
    });
  });
}

window.startRide = async function () {
  if (!currentRide || !currentRideId) return alert("No active ride");

  const enteredOtp = prompt("Enter customer OTP");
  if (!enteredOtp) return;

  if (enteredOtp !== String(currentRide.otp)) {
    alert("Invalid OTP");
    return;
  }

  await updateDoc(doc(db, "rides", currentRideId), {
    status: "Started",
    startedAt: Date.now()
  });

  alert("Ride started!");
};

window.completeRide = async function () {
  if (!currentRide || !currentRideId) return alert("No active ride");

  await updateDoc(doc(db, "rides", currentRideId), {
    status: "Completed",
    completedAt: Date.now()
  });

  await updateDoc(doc(db, "drivers", currentUser.uid), {
    available: true,
    currentRideId: null
  });

  const fare = Number(currentRide.fare || 0);
  const driverEarning = Math.round(fare * 0.85);

  const walletRef = doc(db, "wallets", currentUser.uid);
  const walletSnap = await getDoc(walletRef);
  const currentBalance = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;

  await updateDoc(walletRef, {
    balance: currentBalance + driverEarning
  });

  await addDoc(collection(db, "transactions"), {
    uid: currentUser.uid,
    type: "Driver Earning",
    amount: driverEarning,
    rideId: currentRideId,
    status: "Success",
    createdAt: Date.now()
  });

  alert(`Ride completed. ₹${driverEarning} added.`);
  loadTodayEarnings();
};

function startLiveTracking() {
  if (!navigator.geolocation) return;

  setInterval(() => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const driverLat = position.coords.latitude;
      const driverLng = position.coords.longitude;

      await updateDoc(doc(db, "drivers", currentUser.uid), {
        driverLat,
        driverLng,
        updatedAt: Date.now()
      });

      if (currentRideId) {
        await updateDoc(doc(db, "rides", currentRideId), {
          driverLat,
          driverLng
        });
      }
    });
  }, 5000);
}

window.withdrawNow = function () {
  alert("Withdraw request submitted!");
};
