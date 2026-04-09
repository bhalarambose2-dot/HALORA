import { db, auth } from "./js/firebase-config.js";
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const hotelList = document.getElementById("hotelList");
const searchInput = document.getElementById("searchInput");
const cityFilter = document.getElementById("cityFilter");

// BOOKING MODAL ELEMENTS
const bookingModal = document.getElementById("bookingModal");
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const roomType = document.getElementById("roomType");
const checkInDate = document.getElementById("checkInDate");
const nights = document.getElementById("nights");
const guests = document.getElementById("guests");

let currentUser = null;
let allHotels = [];
let selectedHotel = null;

// ==========================
// AUTH
// ==========================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }
  currentUser = user;
  loadHotels();
});

// ==========================
// LOAD HOTELS
// ==========================
async function loadHotels() {
  try {
    const snapshot = await getDocs(collection(db, "hotels"));
    allHotels = [];
    const citySet = new Set();

    snapshot.forEach((docSnap) => {
      const hotel = docSnap.data();

      if (hotel.status !== "Active") return;

      allHotels.push({
        id: docSnap.id,
        ...hotel
      });

      if (hotel.city) {
        citySet.add(hotel.city);
      }
    });

    cityFilter.innerHTML = `<option value="">All Cities</option>`;
    [...citySet].sort().forEach(city => {
      cityFilter.innerHTML += `<option value="${city}">${city}</option>`;
    });

    renderHotels(allHotels);
  } catch (error) {
    hotelList.innerHTML = `<div class="empty-box">Error loading hotels</div>`;
    console.error("Load Hotels Error:", error);
  }
}

// ==========================
// RENDER HOTELS
// ==========================
function renderHotels(hotels) {
  hotelList.innerHTML = "";

  if (!hotels.length) {
    hotelList.innerHTML = `
      <div class="empty-box">
        <h3>No hotels found</h3>
        <p>Try changing search or city filter.</p>
      </div>
    `;
    return;
  }

  hotels.forEach((hotel) => {
    const image =
      hotel.image?.trim() ||
      hotel.hotelImage?.trim() ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";

    hotelList.innerHTML += `
      <div class="hotel-card">
        <img class="hotel-img" src="${image}" alt="${hotel.hotelName}" />
        <div class="hotel-content">
          <div class="hotel-top">
            <h3 class="hotel-name">${hotel.hotelName || "Hotel"}</h3>
            <div class="price-tag">₹${hotel.roomPrice || 0}/night</div>
          </div>

          <p class="meta">📍 ${hotel.city || "Unknown City"}</p>
          <p class="meta">🛏 ${hotel.availableRooms || 0} Rooms Available</p>
          <p class="desc">${hotel.description || "Comfortable stay with trusted service and smooth booking experience."}</p>

          <button class="book-btn" onclick="openBookingModal('${hotel.id}')">
            Book Now
          </button>
        </div>
      </div>
    `;
  });
}

// ==========================
// FILTERS
// ==========================
function applyFilters() {
  const search = searchInput.value.toLowerCase().trim();
  const city = cityFilter.value.toLowerCase().trim();

  const filtered = allHotels.filter((hotel) => {
    const hotelName = (hotel.hotelName || "").toLowerCase();
    const hotelCity = (hotel.city || "").toLowerCase();

    const matchesSearch =
      hotelName.includes(search) || hotelCity.includes(search);

    const matchesCity =
      !city || hotelCity === city;

    return matchesSearch && matchesCity;
  });

  renderHotels(filtered);
}

searchInput.addEventListener("input", applyFilters);
cityFilter.addEventListener("change", applyFilters);

// ==========================
// OPEN BOOKING MODAL
// ==========================
window.openBookingModal = function (hotelId) {
  selectedHotel = allHotels.find(h => h.id === hotelId);

  if (!selectedHotel) {
    alert("Hotel data not found");
    return;
  }

  bookingModal.classList.add("active");
};

// ==========================
// CLOSE BOOKING MODAL
// ==========================
window.closeBookingModal = function () {
  bookingModal.classList.remove("active");

  customerName.value = "";
  customerPhone.value = "";
  roomType.value = "Standard Room";
  checkInDate.value = "";
  nights.value = "";
  guests.value = "";
};

// ==========================
// SUBMIT BOOKING
// ==========================
window.submitBooking = async function () {
  if (!selectedHotel) {
    alert("No hotel selected");
    return;
  }

  const name = customerName.value.trim();
  const phone = customerPhone.value.trim();
  const selectedRoomType = roomType.value;
  const selectedCheckIn = checkInDate.value;
  const selectedNights = nights.value.trim();
  const selectedGuests = guests.value.trim();

  if (!name || !phone || !selectedCheckIn || !selectedNights || !selectedGuests) {
    alert("Please fill all booking details");
    return;
  }

  try {
    await addDoc(collection(db, "hotelBookings"), {
      hotelId: selectedHotel.id,
      hotelOwnerId: selectedHotel.uid || selectedHotel.ownerId || "",
      hotelName: selectedHotel.hotelName || "HALORA Hotel",
      city: selectedHotel.city || "",
      roomPrice: selectedHotel.roomPrice || 0,

      userId: currentUser.uid,
      userEmail: currentUser.email || "",
      customerName: name,
      customerPhone: phone,

      roomType: selectedRoomType,
      checkInDate: selectedCheckIn,
      nights: Number(selectedNights),
      guests: Number(selectedGuests),

      status: "Pending",
      createdAt: Date.now()
    });

    alert("Booking request sent successfully!");
    closeBookingModal();
  } catch (error) {
    console.error("Booking Error:", error);
    alert(error.message);
  }
};

// ==========================
// ESC CLICK CLOSE
// ==========================
window.addEventListener("click", (e) => {
  if (e.target === bookingModal) {
    closeBookingModal();
  }
});
