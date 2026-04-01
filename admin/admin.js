import { firebaseConfig } from '../firebase-config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const adminBookings = document.getElementById("adminBookings");
const adminPartners = document.getElementById("adminPartners");
const adminKYC = document.getElementById("adminKYC");

async function loadBookings() {
  const snapshot = await getDocs(collection(db, "bookings"));
  snapshot.forEach((docSnap) => {
    const booking = docSnap.data();

    adminBookings.innerHTML += `
      <div class="admin-card">
        <p><strong>${booking.serviceType}</strong></p>
        <p>${booking.pickup} → ${booking.drop}</p>
        <p>₹${booking.price}</p>
        <p>Status: ${booking.status}</p>
        <button onclick="approveBooking('${docSnap.id}')">Approve</button>
      </div>
    `;
  });
}

async function loadPartners() {
  const snapshot = await getDocs(collection(db, "partners"));
  snapshot.forEach((docSnap) => {
    const partner = docSnap.data();

    adminPartners.innerHTML += `
      <div class="admin-card">
        <p>${partner.partnerType || partner.type}</p>
        <p>Status: ${partner.status}</p>
        <button onclick="approvePartner('${docSnap.id}')">Approve</button>
      </div>
    `;
  });
}

async function loadKYC() {
  const snapshot = await getDocs(collection(db, "kyc"));
  snapshot.forEach((docSnap) => {
    const kyc = docSnap.data();

    adminKYC.innerHTML += `
      <div class="admin-card">
        <p>User ID: ${kyc.userId}</p>
        <p>Status: ${kyc.status}</p>
        <a href="${kyc.aadhaarUrl}" target="_blank"><button>Aadhaar</button></a>
        <a href="${kyc.panUrl}" target="_blank"><button>PAN</button></a>
        <a href="${kyc.selfieUrl}" target="_blank"><button>Selfie</button></a>
        <button onclick="approveKYC('${docSnap.id}', '${kyc.userId}')">Approve KYC</button>
      </div>
    `;
  });
}

window.approveBooking = async function (id) {
  await updateDoc(doc(db, "bookings", id), { status: "Approved" });
  alert("Booking approved");
  location.reload();
};

window.approvePartner = async function (id) {
  await updateDoc(doc(db, "partners", id), { status: "Approved" });
  alert("Partner approved");
  location.reload();
};

window.approveKYC = async function (kycId, userId) {
  await updateDoc(doc(db, "kyc", kycId), { status: "Approved" });
  await updateDoc(doc(db, "users", userId), { kycStatus: "Approved" });
  alert("KYC approved");
  location.reload();
};

loadBookings();
loadPartners();
loadKYC();
