// admin/admin.js

import { auth, db } from "../js/firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ==============================
// HTML Elements
// ==============================
const adminBookings = document.getElementById("adminBookings");
const adminPartners = document.getElementById("adminPartners");
const adminKYC = document.getElementById("adminKYC");

// ==============================
// SECURE ADMIN CHECK
// ==============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "../login.html";
    return;
  }

  try {
    const adminRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      alert("Access denied. Not an admin.");
      window.location.href = "../dashboard.html";
      return;
    }

    // If admin verified, load all data
    loadBookings();
    loadPartners();
    loadKYC();

  } catch (error) {
    console.error("Admin auth error:", error);
    alert(error.message);
  }
});

// ==============================
// LOAD BOOKINGS
// ==============================
async function loadBookings() {
  try {
    adminBookings.innerHTML = "<p>Loading bookings...</p>";

    const snapshot = await getDocs(collection(db, "bookings"));
    adminBookings.innerHTML = "";

    if (snapshot.empty) {
      adminBookings.innerHTML = "<p>No bookings found</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const booking = docSnap.data();

      adminBookings.innerHTML += `
        <div class="admin-card">
          <p><strong>${booking.serviceType || "Ride"}</strong></p>
          <p>${booking.pickup || "Pickup"} → ${booking.drop || "Drop"}</p>
          <p>₹${booking.price || 0}</p>
          <p>Status: ${booking.status || "Pending"}</p>
          <button onclick="approveBooking('${docSnap.id}')">Approve</button>
        </div>
      `;
    });

  } catch (error) {
    console.error("Load bookings error:", error);
    adminBookings.innerHTML = "<p>Error loading bookings</p>";
  }
}

// ==============================
// LOAD PARTNERS
// ==============================
async function loadPartners() {
  try {
    adminPartners.innerHTML = "<p>Loading partners...</p>";

    const snapshot = await getDocs(collection(db, "partners"));
    adminPartners.innerHTML = "";

    if (snapshot.empty) {
      adminPartners.innerHTML = "<p>No partners found</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const partner = docSnap.data();

      adminPartners.innerHTML += `
        <div class="admin-card">
          <p><strong>${partner.partnerType || partner.type || "Partner"}</strong></p>
          <p>Status: ${partner.status || "Pending"}</p>
          <button onclick="approvePartner('${docSnap.id}')">Approve</button>
        </div>
      `;
    });

  } catch (error) {
    console.error("Load partners error:", error);
    adminPartners.innerHTML = "<p>Error loading partners</p>";
  }
}

// ==============================
// LOAD KYC
// ==============================
async function loadKYC() {
  try {
    adminKYC.innerHTML = "<p>Loading KYC...</p>";

    const snapshot = await getDocs(collection(db, "kyc"));
    adminKYC.innerHTML = "";

    if (snapshot.empty) {
      adminKYC.innerHTML = "<p>No KYC requests found</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const kyc = docSnap.data();

      adminKYC.innerHTML += `
        <div class="admin-card">
          <p><strong>User ID:</strong> ${kyc.userId || "N/A"}</p>
          <p>Status: ${kyc.status || "Pending"}</p>
          ${kyc.aadhaarUrl ? `<a href="${kyc.aadhaarUrl}" target="_blank"><button>Aadhaar</button></a>` : ""}
          ${kyc.panUrl ? `<a href="${kyc.panUrl}" target="_blank"><button>PAN</button></a>` : ""}
          ${kyc.selfieUrl ? `<a href="${kyc.selfieUrl}" target="_blank"><button>Selfie</button></a>` : ""}
          <button onclick="approveKYC('${docSnap.id}', '${kyc.userId}')">Approve KYC</button>
        </div>
      `;
    });

  } catch (error) {
    console.error("Load KYC error:", error);
    adminKYC.innerHTML = "<p>Error loading KYC</p>";
  }
}

// ==============================
// APPROVE BOOKING
// ==============================
window.approveBooking = async function (id) {
  try {
    await updateDoc(doc(db, "bookings", id), {
      status: "Approved",
      approvedAt: Date.now()
    });

    alert("Booking approved");
    loadBookings();
  } catch (error) {
    alert(error.message);
  }
};

// ==============================
// APPROVE PARTNER
// ==============================
window.approvePartner = async function (id) {
  try {
    await updateDoc(doc(db, "partners", id), {
      status: "Approved",
      approvedAt: Date.now()
    });

    alert("Partner approved");
    loadPartners();
  } catch (error) {
    alert(error.message);
  }
};

// ==============================
// APPROVE KYC
// ==============================
window.approveKYC = async function (kycId, userId) {
  try {
    await updateDoc(doc(db, "kyc", kycId), {
      status: "Approved",
      approvedAt: Date.now()
    });

    await updateDoc(doc(db, "users", userId), {
      kycStatus: "Approved"
    });

    alert("KYC approved");
    loadKYC();
  } catch (error) {
    alert(error.message);
  }
};
