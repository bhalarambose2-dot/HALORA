// admin/admin.js

import { auth, db } from "../js/firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  serverTimestamp
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
// SAFE TEXT FUNCTION
// ==============================
function safeText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
    // ==========================
    // 1. EMAIL BASED ADMIN CHECK
    // ==========================
    const allowedAdminEmails = [
      "bhalarambose2@gmail.com"
    ];

    if (allowedAdminEmails.includes(user.email)) {
      loadBookings();
      loadPartners();
      loadKYC();
      return;
    }

    // ==========================
    // 2. FIRESTORE ROLE CHECK
    // ==========================
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().role !== "admin") {
      alert("Access denied. Admin only.");
      window.location.href = "../dashboard.html";
      return;
    }

    // ==========================
    // ADMIN VERIFIED
    // ==========================
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
          <p><strong>${safeText(booking.serviceType || "Ride")}</strong></p>
          <p>${safeText(booking.pickup || "Pickup")} → ${safeText(booking.drop || "Drop")}</p>
          <p>₹${safeText(booking.price || 0)}</p>
          <p>Status: <span class="status ${String(booking.status || "Pending").toLowerCase()}">${safeText(booking.status || "Pending")}</span></p>

          <div class="admin-actions">
            <button onclick="updateBookingStatus('${docSnap.id}', 'Approved')">Approve</button>
            <button onclick="updateBookingStatus('${docSnap.id}', 'Rejected')">Reject</button>
            <button onclick="deleteBooking('${docSnap.id}')">Delete</button>
          </div>
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
          <p><strong>${safeText(partner.partnerType || partner.type || "Partner")}</strong></p>
          <p>Status: <span class="status ${String(partner.status || "Pending").toLowerCase()}">${safeText(partner.status || "Pending")}</span></p>

          <div class="admin-actions">
            <button onclick="updatePartnerStatus('${docSnap.id}', 'Approved')">Approve</button>
            <button onclick="updatePartnerStatus('${docSnap.id}', 'Rejected')">Reject</button>
            <button onclick="deletePartner('${docSnap.id}')">Delete</button>
          </div>
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
          <p><strong>User ID:</strong> ${safeText(kyc.userId || "N/A")}</p>
          <p>Status: <span class="status ${String(kyc.status || "Pending").toLowerCase()}">${safeText(kyc.status || "Pending")}</span></p>

          <div class="admin-links">
            ${kyc.aadhaarUrl ? `<a href="${kyc.aadhaarUrl}" target="_blank"><button>Aadhaar</button></a>` : ""}
            ${kyc.panUrl ? `<a href="${kyc.panUrl}" target="_blank"><button>PAN</button></a>` : ""}
            ${kyc.selfieUrl ? `<a href="${kyc.selfieUrl}" target="_blank"><button>Selfie</button></a>` : ""}
          </div>

          <div class="admin-actions">
            <button onclick="updateKYCStatus('${docSnap.id}', '${kyc.userId}', 'Approved')">Approve</button>
            <button onclick="updateKYCStatus('${docSnap.id}', '${kyc.userId}', 'Rejected')">Reject</button>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error("Load KYC error:", error);
    adminKYC.innerHTML = "<p>Error loading KYC</p>";
  }
}

// ==============================
// BOOKING ACTIONS
// ==============================
window.updateBookingStatus = async function (id, status) {
  try {
    await updateDoc(doc(db, "bookings", id), {
      status,
      updatedAt: serverTimestamp()
    });

    alert(`Booking ${status}`);
    loadBookings();
  } catch (error) {
    alert(error.message);
  }
};

window.deleteBooking = async function (id) {
  if (!confirm("Delete this booking?")) return;

  try {
    await deleteDoc(doc(db, "bookings", id));
    alert("Booking deleted");
    loadBookings();
  } catch (error) {
    alert(error.message);
  }
};

// ==============================
// PARTNER ACTIONS
// ==============================
window.updatePartnerStatus = async function (id, status) {
  try {
    await updateDoc(doc(db, "partners", id), {
      status,
      updatedAt: serverTimestamp()
    });

    alert(`Partner ${status}`);
    loadPartners();
  } catch (error) {
    alert(error.message);
  }
};

window.deletePartner = async function (id) {
  if (!confirm("Delete this partner request?")) return;

  try {
    await deleteDoc(doc(db, "partners", id));
    alert("Partner deleted");
    loadPartners();
  } catch (error) {
    alert(error.message);
  }
};

// ==============================
// KYC ACTIONS
// ==============================
window.updateKYCStatus = async function (kycId, userId, status) {
  try {
    await updateDoc(doc(db, "kyc", kycId), {
      status,
      updatedAt: serverTimestamp()
    });

    await updateDoc(doc(db, "users", userId), {
      kycStatus: status
    });

    alert(`KYC ${status}`);
    loadKYC();
  } catch (error) {
    alert(error.message);
  }
};
