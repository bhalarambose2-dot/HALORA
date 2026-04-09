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

// ELEMENTS
const editHotelName = document.getElementById("editHotelName");
const editCity = document.getElementById("editCity");
const editContact = document.getElementById("editContact");
const editRooms = document.getElementById("editRooms");
const editCheckIn = document.getElementById("editCheckIn");
const editCheckOut = document.getElementById("editCheckOut");
const editImage = document.getElementById("editImage");
const hotelPreviewImage = document.getElementById("hotelPreviewImage");
const hotelAvailabilityToggle = document.getElementById("hotelAvailabilityToggle");
const hotelStatusText = document.getElementById("hotelStatusText");
const newRoomPrice = document.getElementById("newRoomPrice");

const heroHotelImage = document.getElementById("heroHotelImage");
const totalBookingsEl = document.getElementById("totalBookings");
const roomPriceEl = document.getElementById("roomPrice");
const monthlyEarningsEl = document.getElementById("monthlyEarnings");
const todayBookingsEl = document.getElementById("todayBookings");

const bookingsContainer = document.getElementById("bookingsContainer");
const globalSearch = document.getElementById("globalSearch");
const bookingSearch = document.getElementById("bookingSearch");

const profileAvatar = document.getElementById("profileAvatar");
const profileHotelName = document.getElementById("profileHotelName");
const profileEmail = document.getElementById("profileEmail");

const pendingCountEl = document.getElementById("pendingCount");
const confirmedCountEl = document.getElementById("confirmedCount");
const rejectedCountEl = document.getElementById("rejectedCount");
const earningsChartCanvas = document.getElementById("earningsChart");

let currentUser = null;
let hotelDocId = null;
let hotelData = null;
let allBookings = [];
let currentFilter = "All";
let earningsChart = null;

// AUTH
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  currentUser = user;
  profileEmail.innerText = user.email || "No Email";
  await loadHotelData();
  await loadBookings();
});

// LOAD HOTEL
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

    editHotelName.value = hotelData.hotelName || "";
    editCity.value = hotelData.city || "";
    editContact.value = hotelData.contact || "";
    editRooms.value = hotelData.availableRooms || "";
    editCheckIn.value = convertToTimeInput(hotelData.checkIn || "12:00 PM");
    editCheckOut.value = convertToTimeInput(hotelData.checkOut || "11:00 AM");
    editImage.value = hotelData.image || hotelData.hotelImage || "";
    newRoomPrice.value = hotelData.roomPrice || "";

    const hotelImage =
      hotelData.image ||
      hotelData.hotelImage ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";

    heroHotelImage.src = hotelImage;

    if (hotelPreviewImage) {
      hotelPreviewImage.src = hotelImage;
    }

    roomPriceEl.innerText = `₹${hotelData.roomPrice || 0}`;
    hotelAvailabilityToggle.checked = hotelData.status === "Active";

    hotelStatusText.innerText = hotelData.status === "Active" ? "Active" : "Inactive";
    hotelStatusText.style.color = hotelData.status === "Active" ? "#16a34a" : "#dc2626";

    profileHotelName.innerText = hotelData.hotelName || "HALORA HOTEL";
    profileAvatar.innerText = (hotelData.hotelName || "H").charAt(0).toUpperCase();

    if (hotelData.monthlyEarnings) {
      monthlyEarningsEl.innerText = `₹${hotelData.monthlyEarnings}`;
    }

  } catch (error) {
    console.error("Load Hotel Error:", error);
    alert("Error loading hotel data");
  }
}

// LOAD BOOKINGS
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

  } catch (error) {
    console.error("Load Bookings Error:", error);
    bookingsContainer.innerHTML = `<div class="booking-card">Error loading bookings</div>`;
  }
}

// RENDER BOOKINGS
function renderBookings(bookings) {
  bookingsContainer.innerHTML = "";

  if (!bookings.length) {
    bookingsContainer.innerHTML = `
      <div class="booking-card empty-state">
        <i class="fa-solid fa-calendar-xmark"></i>
        <div>No bookings yet</div>
        <div style="margin-top:8px;font-size:14px;">Customer booking requests will appear here.</div>
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
            <div class="booking-user-info">
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

// CALCULATE STATS
function calculateStats(bookings) {
  const totalBookings = bookings.length;
  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter(b => b.checkInDate === today).length;

  const confirmedBookings = bookings.filter(b => b.status === "Confirmed");
  const monthlyEarnings = confirmedBookings.reduce((sum, b) => {
    return sum + ((Number(b.roomPrice) || 0) * (Number(b.nights) || 1));
  }, 0);

  totalBookingsEl.innerText = totalBookings;
  todayBookingsEl.innerText = todayBookings;
  monthlyEarningsEl.innerText = `₹${monthlyEarnings}`;
}

// COUNTS
function updateBookingCounts(bookings) {
  const pending = bookings.filter(b => b.status === "Pending").length;
  const confirmed = bookings.filter(b => b.status === "Confirmed").length;
  const rejected = bookings.filter(b => b.status === "Rejected").length;

  if (pendingCountEl) pendingCountEl.innerText = pending;
  if (confirmedCountEl) confirmedCountEl.innerText = confirmed;
  if (rejectedCountEl) rejectedCountEl.innerText = rejected;
}

// FILTER
window.filterBookings = function (status, btn) {
  currentFilter = status;

  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active-filter"));
  if (btn) btn.classList.add("active-filter");

  applyBookingFilters();
};

// SEARCH + FILTER
function applyBookingFilters() {
  const globalText = (globalSearch?.value || "").toLowerCase().trim();
  const bookingText = (bookingSearch?.value || "").toLowerCase().trim();
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

// SAVE HOTEL
window.saveHotelDetails = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  try {
    const updatedData = {
      hotelName: editHotelName.value.trim(),
      city: editCity.value.trim(),
      contact: editContact.value.trim(),
      availableRooms: Number(editRooms.value) || 0,
      checkIn: convertToAMPM(editCheckIn.value),
      checkOut: convertToAMPM(editCheckOut.value),
      image: editImage.value.trim()
    };

    await updateDoc(doc(db, "hotels", hotelDocId), updatedData);
    alert("Hotel details updated successfully!");
    await loadHotelData();
  } catch (error) {
    console.error("Save Hotel Error:", error);
    alert("Failed to update hotel details");
  }
};

// UPDATE PRICE
window.updateRoomPrice = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  const price = Number(newRoomPrice.value);
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

// TOGGLE STATUS
window.toggleHotelStatus = async function () {
  if (!hotelDocId) return;

  try {
    const newStatus = hotelAvailabilityToggle.checked ? "Active" : "Inactive";
    await updateDoc(doc(db, "hotels", hotelDocId), { status: newStatus });

    hotelStatusText.innerText = newStatus;
    hotelStatusText.style.color = newStatus === "Active" ? "#16a34a" : "#dc2626";
  } catch (error) {
    console.error("Status Update Error:", error);
    alert("Failed to update hotel status");
  }
};

// UPDATE BOOKING STATUS
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

// GRAPH
function renderEarningsChart(bookings) {
  if (!earningsChartCanvas || typeof Chart === "undefined") return;

  const monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  bookings.forEach((booking) => {
    if (booking.status !== "Confirmed") return;

    const date = booking.createdAt ? new Date(booking.createdAt) : new Date();
    const month = date.getMonth();
    const amount = (Number(booking.roomPrice) || 0) * (Number(booking.nights) || 1);

    monthlyData[month] += amount;
  });

  if (earningsChart) {
    earningsChart.destroy();
  }

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
          labels: {
            color: "#0f172a"
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#475569" },
          grid: { color: "rgba(15,23,42,0.05)" }
        },
        y: {
          ticks: { color: "#475569" },
          grid: { color: "rgba(15,23,42,0.05)" }
        }
      }
    }
  });
}

// SEARCH EVENTS
if (globalSearch) globalSearch.addEventListener("input", applyBookingFilters);
if (bookingSearch) bookingSearch.addEventListener("input", applyBookingFilters);

// LIVE IMAGE PREVIEW
if (editImage && hotelPreviewImage) {
  editImage.addEventListener("input", () => {
    const value = editImage.value.trim();
    const fallback = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";
    hotelPreviewImage.src = value || fallback;
    heroHotelImage.src = value || fallback;
  });
}

// TAB SWITCH
window.openTab = function (panelId, btn) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(panelId).classList.add("active");
  btn.classList.add("active");
};

// LOGOUT
window.logout = async function () {
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch (error) {
    alert("Logout failed");
  }
};

// TIME HELPERS
function convertToAMPM(time24) {
  if (!time24) return "";
  let [hours, minutes] = time24.split(":");
  hours = parseInt(hours);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function convertToTimeInput(time12h) {
  if (!time12h) return "";
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
      }
