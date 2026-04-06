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

let currentUser = null;
let allHotels = [];

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

      allHotels.push(hotel);

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
    console.error(error);
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
    const image = hotel.image?.trim() || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop";

    hotelList.innerHTML += `
      <div class="hotel-card">
        <img class="hotel-img" src="${image}" alt="${hotel.hotelName}" />
        <div class="hotel-content">
          <div class="hotel-top">
            <h3 class="hotel-name">${hotel.hotelName || "Hotel"}</h3>
            <div class="price-tag">₹${hotel.roomPrice || 0}/night</div>
          </div>

          <p class="meta">📍 ${hotel.city || "Unknown City"}</p>
          <p class="desc">${hotel.description || "Comfortable stay with trusted service and smooth booking experience."}</p>

          <button class="book-btn" onclick="bookHotel('${hotel.uid}', '${hotel.hotelName}', '${hotel.city}', ${hotel.roomPrice || 0})">
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
// BOOK HOTEL
// ==========================
window.bookHotel = async function (hotelOwnerId, hotelName, city, price) {
  const checkin = prompt("Enter Check-in Date (YYYY-MM-DD)");
  if (!checkin) return;

  try {
    await addDoc(collection(db, "hotelBookings"), {
      hotelOwnerId,
      hotelName,
      city,
      roomPrice: price,
      userId: currentUser.uid,
      userName: currentUser.email,
      checkin,
      status: "Pending",
      createdAt: Date.now()
    });

    alert("Hotel booked successfully!");
  } catch (error) {
    alert(error.message);
  }
};
