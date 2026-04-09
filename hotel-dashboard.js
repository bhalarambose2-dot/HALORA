import { db, auth } from "./js/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// =========================
// SAFE ELEMENT GETTER
// =========================
const $ = (id) => document.getElementById(id);

// =========================
// ELEMENTS
// =========================
const profileEmail = $("profileEmail");
const profileHotelName = $("profileHotelName");
const profileAvatar = $("profileAvatar");

const editHotelName = $("editHotelName");
const editCity = $("editCity");
const editContact = $("editContact");
const editRooms = $("editRooms");
const newRoomPrice = $("newRoomPrice");

const totalBookingsEl = $("totalBookings");
const roomPriceEl = $("roomPrice");
const monthlyEarningsEl = $("monthlyEarnings");
const todayBookingsEl = $("todayBookings");

const heroHotelImage = $("heroHotelImage");
const bookingsContainer = $("bookingsContainer");
const upiIdInput = $("upiIdInput");

// Edit profile panel
const profileEditHotelName = $("profileEditHotelName");
const profileEditCity = $("profileEditCity");
const profileEditContact = $("profileEditContact");

// KYC panel
const kycAadhar = $("kycAadhar");
const kycPan = $("kycPan");

// =========================
// STATE
// =========================
let currentUser = null;
let hotelDocId = null;
let hotelData = null;
let allBookings = [];

// =========================
// AUTH CHECK
// =========================
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      console.warn("No user logged in");
      // Agar login page hai to redirect
      // window.location.href = "./login.html";
      return;
    }

    currentUser = user;

    if (profileEmail) {
      profileEmail.innerText = user.email || "No Email";
    }

    await loadHotelData();
    await loadBookings();

  } catch (error) {
    console.error("Auth Error:", error);
  }
});

// =========================
// LOAD HOTEL DATA
// =========================
async function loadHotelData() {
  try {
    if (!currentUser) return;

    const q = query(
      collection(db, "hotels"),
      where("uid", "==", currentUser.uid)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn("No hotel found for this user");
      fillDefaultHotelUI();
      return;
    }

    const docSnap = snapshot.docs[0];
    hotelDocId = docSnap.id;
    hotelData = docSnap.data();

    // ===== PROFILE =====
    if (profileHotelName) {
      profileHotelName.innerText = hotelData.hotelName || "HALORA HOTEL";
    }

    if (profileAvatar) {
      profileAvatar.innerText = (hotelData.hotelName || "H").charAt(0).toUpperCase();
    }

    // ===== MANAGEMENT =====
    if (editHotelName) editHotelName.value = hotelData.hotelName || "";
    if (editCity) editCity.value = hotelData.city || "";
    if (editContact) editContact.value = hotelData.contact || "";
    if (editRooms) editRooms.value = hotelData.availableRooms || "";
    if (newRoomPrice) newRoomPrice.value = hotelData.roomPrice || "";

    // ===== PROFILE EDIT PANEL =====
    if (profileEditHotelName) profileEditHotelName.value = hotelData.hotelName || "";
    if (profileEditCity) profileEditCity.value = hotelData.city || "";
    if (profileEditContact) profileEditContact.value = hotelData.contact || "";

    // ===== PAYMENTS =====
    if (upiIdInput) upiIdInput.value = hotelData.upiId || "";

    // ===== KYC =====
    if (kycAadhar) kycAadhar.value = hotelData.kycAadhar || "";
    if (kycPan) kycPan.value = hotelData.kycPan || "";

    // ===== HOME STATS =====
    if (roomPriceEl) roomPriceEl.innerText = `₹${hotelData.roomPrice || 0}`;
    if (monthlyEarningsEl) monthlyEarningsEl.innerText = `₹${hotelData.monthlyEarnings || 0}`;

    // ===== HERO IMAGE =====
    if (heroHotelImage) {
      heroHotelImage.src =
        hotelData.image ||
        hotelData.hotelImage ||
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";
    }

  } catch (error) {
    console.error("Load Hotel Error:", error);
    fillDefaultHotelUI();
  }
}

// =========================
// DEFAULT UI IF NO HOTEL
// =========================
function fillDefaultHotelUI() {
  if (profileHotelName) profileHotelName.innerText = "HALORA HOTEL";
  if (profileAvatar) profileAvatar.innerText = "H";
  if (roomPriceEl) roomPriceEl.innerText = "₹0";
  if (monthlyEarningsEl) monthlyEarningsEl.innerText = "₹0";
  if (totalBookingsEl) totalBookingsEl.innerText = "0";
  if (todayBookingsEl) todayBookingsEl.innerText = "0";
}

// =========================
// LOAD BOOKINGS
// =========================
async function loadBookings() {
  try {
    if (!currentUser) return;

    const q = query(
      collection(db, "hotelBookings"),
      where("hotelOwnerId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(q);

    allBookings = [];
    snapshot.forEach((docSnap) => {
      allBookings.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    renderBookings(allBookings);
    calculateStats(allBookings);

  } catch (error) {
    console.error("Load Bookings Error:", error);
    if (bookingsContainer) {
      bookingsContainer.innerHTML = `
        <div class="management-card">
          Booking data load nahi hua.
        </div>
      `;
    }
  }
}

// =========================
// RENDER BOOKINGS
// =========================
function renderBookings(bookings) {
  if (!bookingsContainer) return;

  bookingsContainer.innerHTML = "";

  if (!bookings.length) {
    bookingsContainer.innerHTML = `
      <div class="management-card">
        No bookings yet.
      </div>
    `;
    return;
  }

  bookings.forEach((booking) => {
    let statusClass = "pending";
    if (booking.status === "Confirmed") statusClass = "confirmed";
    if (booking.status === "Rejected") statusClass = "rejected";

    bookingsContainer.innerHTML += `
      <div class="booking-card">
        <div class="booking-top">
          <div class="booking-avatar-row">
            <div class="booking-avatar">${(booking.customerName || "G").charAt(0).toUpperCase()}</div>
            <div>
              <div class="booking-name">${booking.customerName || "Guest"}</div>
              <div class="booking-sub">${booking.roomType || "Standard Room"}</div>
            </div>
          </div>
          <div class="booking-status ${statusClass}">${booking.status || "Pending"}</div>
        </div>

        <div class="booking-details">
          📅 ${booking.checkInDate || "-"} <br>
          👥 ${booking.guests || 1} Guests <br>
          📞 ${booking.customerPhone || "-"}
        </div>
      </div>
    `;
  });
}

// =========================
// CALCULATE STATS
// =========================
function calculateStats(bookings) {
  const total = bookings.length;
  const today = new Date().toISOString().split("T")[0];

  const todayCount = bookings.filter(b => b.checkInDate === today).length;

  const confirmed = bookings.filter(b => b.status === "Confirmed");
  const earnings = confirmed.reduce((sum, b) => {
    return sum + ((Number(b.roomPrice) || 0) * (Number(b.nights) || 1));
  }, 0);

  if (totalBookingsEl) totalBookingsEl.innerText = total;
  if (todayBookingsEl) todayBookingsEl.innerText = todayCount;
  if (monthlyEarningsEl) monthlyEarningsEl.innerText = `₹${earnings}`;
}

// =========================
// SAVE HOTEL DETAILS
// =========================
window.saveHotelDetails = async function () {
  try {
    if (!hotelDocId) return alert("Hotel not found");

    const updatedData = {
      hotelName: editHotelName?.value?.trim() || "",
      city: editCity?.value?.trim() || "",
      contact: editContact?.value?.trim() || "",
      availableRooms: Number(editRooms?.value) || 0
    };

    await updateDoc(doc(db, "hotels", hotelDocId), updatedData);
    alert("Hotel details updated ✅");
    await loadHotelData();

  } catch (error) {
    console.error("Save Hotel Error:", error);
    alert("Save failed");
  }
};

// =========================
// UPDATE ROOM PRICE
// =========================
window.updateRoomPrice = async function () {
  try {
    if (!hotelDocId) return alert("Hotel not found");

    const price = Number(newRoomPrice?.value);
    if (!price) return alert("Enter valid room price");

    await updateDoc(doc(db, "hotels", hotelDocId), {
      roomPrice: price
    });

    alert("Room price updated ✅");
    await loadHotelData();

  } catch (error) {
    console.error("Update Price Error:", error);
    alert("Price update failed");
  }
};

// =========================
// SAVE PROFILE
// =========================
window.saveProfile = async function () {
  try {
    if (!hotelDocId) return alert("Hotel not found");

    const name = profileEditHotelName?.value?.trim() || "";
    const city = profileEditCity?.value?.trim() || "";
    const contact = profileEditContact?.value?.trim() || "";

    await updateDoc(doc(db, "hotels", hotelDocId), {
      hotelName: name,
      city: city,
      contact: contact
    });

    alert("Profile Updated ✅");
    await loadHotelData();

  } catch (error) {
    console.error("Save Profile Error:", error);
    alert("Profile update failed");
  }
};

// =========================
// SAVE KYC
// =========================
window.saveKYC = async function () {
  try {
    if (!hotelDocId) return alert("Hotel not found");

    const aadhar = kycAadhar?.value?.trim() || "";
    const pan = kycPan?.value?.trim() || "";

    await updateDoc(doc(db, "hotels", hotelDocId), {
      kycAadhar: aadhar,
      kycPan: pan,
      kycStatus: "Pending"
    });

    alert("KYC Submitted ✅");

  } catch (error) {
    console.error("KYC Error:", error);
    alert("KYC save failed");
  }
};

// =========================
// SAVE PAYMENT / UPI
// =========================
window.savePayment = async function () {
  try {
    if (!hotelDocId) return alert("Hotel not found");

    const upi = upiIdInput?.value?.trim() || "";
    if (!upi) return alert("Enter UPI ID");

    await updateDoc(doc(db, "hotels", hotelDocId), {
      upiId: upi
    });

    alert("UPI Updated ✅");

  } catch (error) {
    console.error("Payment Error:", error);
    alert("UPI save failed");
  }
};

// =========================
// LOGOUT
// =========================
window.logout = async function () {
  try {
    await signOut(auth);
    alert("Logged out ✅");
    // window.location.href = "./login.html";
  } catch (error) {
    console.error("Logout Error:", error);
    alert("Logout failed");
  }
};
