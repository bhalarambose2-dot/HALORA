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

// ================= GLOBAL =================
let currentUser = null;
let hotelDocId = null;
let hotelData = null;
let allBookings = [];
let currentFilter = "All";
let earningsChart = null;

// ================= SAFE ELEMENT GETTER =================
const $ = (id) => document.getElementById(id);

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  currentUser = user;

  const profileEmail = $("profileEmail");
  if (profileEmail) profileEmail.innerText = user.email || "No Email";

  await loadHotelData();
  await loadBookings();
});

// ================= LOAD HOTEL =================
async function loadHotelData() {
  try {
    const q = query(collection(db, "hotels"), where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("No hotel found for this account");
      return;
    }

    const docSnap = snapshot.docs[0];
    hotelDocId = docSnap.id;
    hotelData = docSnap.data();

    // -------- PROFILE --------
    const profileHotelName = $("profileHotelName");
    const profileAvatar = $("profileAvatar");
    const profileEmail = $("profileEmail");

    if (profileHotelName) profileHotelName.innerText = hotelData.hotelName || "HALORA HOTEL";
    if (profileAvatar) profileAvatar.innerText = (hotelData.hotelName || "H").charAt(0).toUpperCase();
    if (profileEmail) profileEmail.innerText = currentUser.email || "No Email";

    // -------- HERO / IMAGE --------
    const heroHotelImage = $("heroHotelImage");
    const hotelPreviewImage = $("hotelPreviewImage");

    const hotelImage =
      hotelData.image ||
      hotelData.hotelImage ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";

    if (heroHotelImage) heroHotelImage.src = hotelImage;
    if (hotelPreviewImage) hotelPreviewImage.src = hotelImage;

    // -------- HOME STATS --------
    const roomPriceEl = $("roomPrice");
    const monthlyEarningsEl = $("monthlyEarnings");

    if (roomPriceEl) roomPriceEl.innerText = `₹${hotelData.roomPrice || 0}`;
    if (monthlyEarningsEl) monthlyEarningsEl.innerText = `₹${hotelData.monthlyEarnings || 0}`;

    // -------- MANAGEMENT --------
    const editHotelName = $("editHotelName");
    const editCity = $("editCity");
    const editContact = $("editContact");
    const editRooms = $("editRooms");
    const editCheckIn = $("editCheckIn");
    const editCheckOut = $("editCheckOut");
    const editImage = $("editImage");
    const newRoomPrice = $("newRoomPrice");
    const hotelAvailabilityToggle = $("hotelAvailabilityToggle");
    const hotelStatusText = $("hotelStatusText");

    if (editHotelName) editHotelName.value = hotelData.hotelName || "";
    if (editCity) editCity.value = hotelData.city || "";
    if (editContact) editContact.value = hotelData.contact || "";
    if (editRooms) editRooms.value = hotelData.availableRooms || "";
    if (editCheckIn) editCheckIn.value = convertToTimeInput(hotelData.checkIn || "12:00 PM");
    if (editCheckOut) editCheckOut.value = convertToTimeInput(hotelData.checkOut || "11:00 AM");
    if (editImage) editImage.value = hotelData.image || hotelData.hotelImage || "";
    if (newRoomPrice) newRoomPrice.value = hotelData.roomPrice || "";

    const isActive = hotelData.status === "Active";

    if (hotelAvailabilityToggle) hotelAvailabilityToggle.checked = isActive;
    if (hotelStatusText) {
      hotelStatusText.innerText = isActive ? "Active" : "Inactive";
      hotelStatusText.style.color = isActive ? "#16a34a" : "#dc2626";
    }

    // -------- PROFILE EDIT PANEL --------
    const profileEditHotelName = $("profileEditHotelName");
    const profileEditCity = $("profileEditCity");
    const profileEditContact = $("profileEditContact");

    if (profileEditHotelName) profileEditHotelName.value = hotelData.hotelName || "";
    if (profileEditCity) profileEditCity.value = hotelData.city || "";
    if (profileEditContact) profileEditContact.value = hotelData.contact || "";

    // -------- KYC / PAYMENTS PREFILL --------
    const kycAadhar = $("kycAadhar");
    const kycPan = $("kycPan");
    const upiIdInput = $("upiIdInput");

    if (kycAadhar) kycAadhar.value = hotelData.kycAadhar || "";
    if (kycPan) kycPan.value = hotelData.kycPan || "";
    if (upiIdInput) upiIdInput.value = hotelData.upiId || "";

  } catch (error) {
    console.error("Load Hotel Error:", error);
    alert("Error loading hotel data");
  }
}

// ================= LOAD BOOKINGS =================
async function loadBookings() {
  try {
    const q = query(collection(db, "hotelBookings"), where("hotelOwnerId", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    allBookings = [];
    snapshot.forEach((docSnap) => {
      allBookings.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    allBookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    renderBookings(allBookings);
    calculateStats(allBookings);
    updateBookingCounts(allBookings);
    renderEarningsChart(allBookings);
    renderHistory(allBookings);
    renderCustomers(allBookings);
    renderNotifications(allBookings);

  } catch (error) {
    console.error("Load Bookings Error:", error);
    const bookingsContainer = $("bookingsContainer");
    if (bookingsContainer) {
      bookingsContainer.innerHTML = `<div class="booking-card">Error loading bookings</div>`;
    }
  }
}

// ================= RENDER BOOKINGS =================
function renderBookings(bookings) {
  const bookingsContainer = $("bookingsContainer");
  if (!bookingsContainer) return;

  bookingsContainer.innerHTML = "";

  if (!bookings.length) {
    bookingsContainer.innerHTML = `
      <div class="booking-card" style="text-align:center;">
        <i class="fa-solid fa-calendar-xmark" style="font-size:34px;color:#2563eb;"></i>
        <div style="margin-top:12px;font-weight:800;">No bookings yet</div>
        <div style="margin-top:8px;font-size:14px;color:#64748b;">Customer booking requests will appear here.</div>
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
            <div class="booking-avatar">${(booking.customerName || booking.userEmail || "G").charAt(0).toUpperCase()}</div>
            <div>
              <div class="booking-name">${booking.customerName || booking.userEmail || "Guest"}</div>
              <div class="booking-sub">${booking.roomType || "Standard Room"}</div>
            </div>
          </div>
          <div class="booking-status ${statusClass}">${booking.status || "Pending"}</div>
        </div>

        <div class="booking-details">
          📅 ${booking.checkInDate || "-"} • 🌙 ${booking.nights || 1} Nights • 👥 ${booking.guests || 1} Guests<br>
          📞 ${booking.customerPhone || "-"}
        </div>

        <div class="booking-actions">
          <button class="approve-btn" onclick="updateBookingStatus('${booking.id}','Confirmed')">Approve</button>
          <button class="reject-btn" onclick="updateBookingStatus('${booking.id}','Rejected')">Reject</button>
        </div>
      </div>
    `;
  });
}

// ================= CALCULATE STATS =================
function calculateStats(bookings) {
  const totalBookingsEl = $("totalBookings");
  const todayBookingsEl = $("todayBookings");
  const monthlyEarningsEl = $("monthlyEarnings");

  const totalBookings = bookings.length;
  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter(b => b.checkInDate === today).length;

  const confirmedBookings = bookings.filter(b => b.status === "Confirmed");
  const monthlyEarnings = confirmedBookings.reduce((sum, b) => {
    return sum + ((Number(b.roomPrice) || 0) * (Number(b.nights) || 1));
  }, 0);

  if (totalBookingsEl) totalBookingsEl.innerText = totalBookings;
  if (todayBookingsEl) todayBookingsEl.innerText = todayBookings;
  if (monthlyEarningsEl) monthlyEarningsEl.innerText = `₹${monthlyEarnings}`;
}

// ================= COUNTS =================
function updateBookingCounts(bookings) {
  const pendingCountEl = $("pendingCount");
  const confirmedCountEl = $("confirmedCount");
  const rejectedCountEl = $("rejectedCount");

  const pending = bookings.filter(b => b.status === "Pending").length;
  const confirmed = bookings.filter(b => b.status === "Confirmed").length;
  const rejected = bookings.filter(b => b.status === "Rejected").length;

  if (pendingCountEl) pendingCountEl.innerText = pending;
  if (confirmedCountEl) confirmedCountEl.innerText = confirmed;
  if (rejectedCountEl) rejectedCountEl.innerText = rejected;
}

// ================= FILTER =================
window.filterBookings = function (status, btn) {
  currentFilter = status;

  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active-filter"));
  if (btn) btn.classList.add("active-filter");

  applyBookingFilters();
};

// ================= SEARCH + FILTER =================
function applyBookingFilters() {
  const globalText = ($("globalSearch")?.value || "").toLowerCase().trim();
  const bookingText = ($("bookingSearch")?.value || "").toLowerCase().trim();
  const searchText = `${globalText} ${bookingText}`.trim();

  let filtered = allBookings.filter((booking) => {
    const text = `
      ${booking.customerName || ""}
      ${booking.userEmail || ""}
      ${booking.roomType || ""}
      ${booking.customerPhone || ""}
      ${booking.status || ""}
      ${booking.checkInDate || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(searchText);
    const matchesFilter = currentFilter === "All" || booking.status === currentFilter;

    return matchesSearch && matchesFilter;
  });

  renderBookings(filtered);
}

// ================= SAVE HOTEL =================
window.saveHotelDetails = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  try {
    const updatedData = {
      hotelName: $("editHotelName")?.value?.trim() || "",
      city: $("editCity")?.value?.trim() || "",
      contact: $("editContact")?.value?.trim() || "",
      availableRooms: Number($("editRooms")?.value) || 0,
      checkIn: convertToAMPM($("editCheckIn")?.value),
      checkOut: convertToAMPM($("editCheckOut")?.value),
      image: $("editImage")?.value?.trim() || ""
    };

    await updateDoc(doc(db, "hotels", hotelDocId), updatedData);
    alert("Hotel details updated successfully!");
    await loadHotelData();
  } catch (error) {
    console.error("Save Hotel Error:", error);
    alert("Failed to update hotel details");
  }
};

// ================= UPDATE ROOM PRICE =================
window.updateRoomPrice = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  const price = Number($("newRoomPrice")?.value);
  if (!price) return alert("Enter valid room price");

  try {
    await updateDoc(doc(db, "hotels", hotelDocId), { roomPrice: price });
    alert("Room price updated successfully!");
    await loadHotelData();
  } catch (error) {
    console.error("Update Price Error:", error);
    alert("Failed to update room price");
  }
};

// ================= TOGGLE HOTEL STATUS =================
window.toggleHotelStatus = async function () {
  if (!hotelDocId) return;

  try {
    const newStatus = $("hotelAvailabilityToggle")?.checked ? "Active" : "Inactive";
    await updateDoc(doc(db, "hotels", hotelDocId), { status: newStatus });

    const hotelStatusText = $("hotelStatusText");
    if (hotelStatusText) {
      hotelStatusText.innerText = newStatus;
      hotelStatusText.style.color = newStatus === "Active" ? "#16a34a" : "#dc2626";
    }
  } catch (error) {
    console.error("Status Update Error:", error);
    alert("Failed to update hotel status");
  }
};

// ================= UPDATE BOOKING STATUS =================
window.updateBookingStatus = async function (bookingId, status) {
  try {
    const bookingRef = doc(db, "hotelBookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) return alert("Booking not found");

    const bookingData = bookingSnap.data();
    if (bookingData.status === status) return alert(`Booking already ${status}`);

    await updateDoc(bookingRef, { status });

    if (status === "Confirmed" && hotelDocId) {
      const hotelRef = doc(db, "hotels", hotelDocId);
      const hotelSnap = await getDoc(hotelRef);

      if (hotelSnap.exists()) {
        const hotel = hotelSnap.data();
        const currentRooms = Number(hotel.availableRooms || 0);
        const currentEarnings = Number(hotel.monthlyEarnings || 0);
        const bookingAmount = Number(bookingData.roomPrice || hotel.roomPrice || 0) * Number(bookingData.nights || 1);

        await updateDoc(hotelRef, {
          availableRooms: currentRooms > 0 ? currentRooms - 1 : 0,
          monthlyEarnings: currentEarnings + bookingAmount
        });
      }
    }

    alert(`Booking ${status}`);
    await loadHotelData();
    await loadBookings();
    applyBookingFilters();

  } catch (error) {
    console.error("Booking Status Error:", error);
    alert("Failed to update booking status");
  }
};

// ================= PROFILE SAVE =================
window.saveProfile = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  try {
    const name = $("profileEditHotelName")?.value?.trim() || "";
    const city = $("profileEditCity")?.value?.trim() || "";
    const contact = $("profileEditContact")?.value?.trim() || "";

    await updateDoc(doc(db, "hotels", hotelDocId), {
      hotelName: name,
      city: city,
      contact: contact
    });

    alert("Profile Updated ✅");
    await loadHotelData();
  } catch (error) {
    console.error("Profile Save Error:", error);
    alert("Failed to update profile");
  }
};

// ================= KYC SAVE =================
window.saveKYC = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  try {
    const aadhar = $("kycAadhar")?.value?.trim() || "";
    const pan = $("kycPan")?.value?.trim() || "";

    await updateDoc(doc(db, "hotels", hotelDocId), {
      kycAadhar: aadhar,
      kycPan: pan,
      kycStatus: "Pending"
    });

    alert("KYC Submitted ✅");
    await loadHotelData();
  } catch (error) {
    console.error("KYC Save Error:", error);
    alert("Failed to save KYC");
  }
};

// ================= PAYMENT SAVE =================
window.savePayment = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  try {
    const upi = $("upiIdInput")?.value?.trim() || "";
    if (!upi) return alert("Enter UPI ID");

    await updateDoc(doc(db, "hotels", hotelDocId), {
      upiId: upi
    });

    alert("UPI Updated ✅");
    await loadHotelData();
  } catch (error) {
    console.error("Payment Save Error:", error);
    alert("Failed to save payment info");
  }
};

// ================= HISTORY =================
function renderHistory(bookings) {
  const historyPanel = $("historyPanel");
  if (!historyPanel) return;

  const card = historyPanel.querySelector(".management-card");
  if (!card) return;

  const existingItems = card.querySelectorAll(".history-item");
  existingItems.forEach(item => item.remove());

  if (!bookings.length) {
    const empty = document.createElement("div");
    empty.className = "history-item";
    empty.innerHTML = "No booking history found";
    card.insertBefore(empty, card.querySelector(".back-btn"));
    return;
  }

  bookings.slice(0, 10).forEach((b) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div style="font-weight:800;">${b.customerName || "Guest"}</div>
      <div class="subtext">🏨 ${b.roomType || "Room"} • 📅 ${b.checkInDate || "-"} • ₹${(Number(b.roomPrice) || 0) * (Number(b.nights) || 1)}</div>
    `;
    card.insertBefore(div, card.querySelector(".back-btn"));
  });
}

// ================= CUSTOMERS =================
function renderCustomers(bookings) {
  const customersPanel = $("customersPanel");
  if (!customersPanel) return;

  const card = customersPanel.querySelector(".management-card");
  if (!card) return;

  const existingItems = card.querySelectorAll(".customer-item");
  existingItems.forEach(item => item.remove());

  const uniqueCustomers = {};
  bookings.forEach((b) => {
    const key = b.customerPhone || b.userEmail || b.customerName;
    if (!uniqueCustomers[key]) {
      uniqueCustomers[key] = b;
    }
  });

  const customers = Object.values(uniqueCustomers);

  if (!customers.length) {
    const empty = document.createElement("div");
    empty.className = "customer-item";
    empty.innerHTML = "No customers found";
    card.insertBefore(empty, card.querySelector(".back-btn"));
    return;
  }

  customers.forEach((c) => {
    const div = document.createElement("div");
    div.className = "customer-item";
    div.innerHTML = `
      <div style="font-weight:800;">${c.customerName || "Guest"}</div>
      <div class="subtext">📞 ${c.customerPhone || "-"} • ${c.userEmail || ""}</div>
    `;
    card.insertBefore(div, card.querySelector(".back-btn"));
  });
}

// ================= NOTIFICATIONS =================
function renderNotifications(bookings) {
  const notificationsPanel = $("notificationsPanel");
  if (!notificationsPanel) return;

  const card = notificationsPanel.querySelector(".management-card");
  if (!card) return;

  const existingItems = card.querySelectorAll(".notif-item");
  existingItems.forEach(item => item.remove());

  if (!bookings.length) {
    const empty = document.createElement("div");
    empty.className = "notif-item";
    empty.innerHTML = "No new notifications";
    card.insertBefore(empty, card.querySelector(".back-btn"));
    return;
  }

  bookings.slice(0, 10).forEach((b) => {
    const div = document.createElement("div");
    div.className = "notif-item";
    div.innerHTML = `
      <div style="font-weight:800;">New booking received</div>
      <div class="subtext">${b.customerName || "Guest"} booked ${b.roomType || "a room"}</div>
    `;
    card.insertBefore(div, card.querySelector(".back-btn"));
  });
}

// ================= CHART =================
function renderEarningsChart(bookings) {
  const earningsChartCanvas = $("earningsChart");
  if (!earningsChartCanvas || typeof Chart === "undefined") return;

  const monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  bookings.forEach((booking) => {
    if (booking.status !== "Confirmed") return;

    const date = booking.createdAt ? new Date(booking.createdAt) : new Date();
    const month = date.getMonth();
    const amount = (Number(booking.roomPrice) || 0) * (Number(booking.nights) || 1);

    monthlyData[month] += amount;
  });

  if (earningsChart) earningsChart.destroy();

  earningsChart = new Chart(earningsChartCanvas, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [{
        label: "Monthly Earnings",
        data: monthlyData,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#60a5fa"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#0
