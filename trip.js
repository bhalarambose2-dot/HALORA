<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDJnOh92AYUzFeWtuLMtDciETdpCQ7-MNs",
  authDomain: "halorebook.firebaseapp.com",
  projectId: "halorebook",
  storageBucket: "halorebook.firebasestorage.app",
  messagingSenderId: "58132767978",
  appId: "1:58132767978:web:2165ca8a94fb0cfe5a6393"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= DOM =================
const tripGrid = document.getElementById("tripGrid");
const tripSearchInput = document.getElementById("tripSearchInput");
const tripFilterButtons = document.querySelectorAll(".trip-filter-btn");
const tripEmptyState = document.getElementById("tripEmptyState");
const tripModal = document.getElementById("tripModal");
const tripModalContent = document.getElementById("tripModalContent");

let allTrips = [];
let currentTripFilter = "All";

// ================= LOAD FIREBASE =================
async function loadTrips() {
  const snap = await getDocs(collection(db, "trips"));
  allTrips = [];

  snap.forEach(doc => {
    allTrips.push(doc.data());
  });

  console.log("Trips:", allTrips);

  renderTripsSection();
}

// ================= RENDER =================
function renderTripsSection() {
  const searchValue = tripSearchInput.value.toLowerCase();

  const filtered = allTrips.filter(dest => {
    const categories = Array.isArray(dest.category)
      ? dest.category
      : [dest.category];

    return (
      dest.name?.toLowerCase().includes(searchValue) &&
      (currentTripFilter === "All" || categories.includes(currentTripFilter))
    );
  });

  tripGrid.innerHTML = "";

  if (filtered.length === 0) {
    tripEmptyState.style.display = "block";
    return;
  } else {
    tripEmptyState.style.display = "none";
  }

  filtered.forEach(dest => {
    const card = document.createElement("div");
    card.className = "trip-card";

    card.innerHTML = `
      <img class="trip-img" src="${dest.image || 'https://via.placeholder.com/400'}">
      <button class="trip-heart-btn">♡</button>

      <div class="trip-content">
        <div class="trip-title-row">
          <div>${dest.name}</div>
          <div class="trip-budget-badge">${dest.budget}</div>
        </div>

        <div class="trip-meta">
          <span>🗓 ${dest.days}</span>
          <span>🌤 ${dest.bestTime}</span>
        </div>

        <div class="trip-card-buttons">
          <button class="trip-btn trip-btn-outline details-btn">Details</button>
          <button class="trip-btn trip-btn-primary book-btn">Book</button>
        </div>
      </div>
    `;

    // ❤️ Heart
    const heartBtn = card.querySelector(".trip-heart-btn");
    heartBtn.onclick = () => {
      heartBtn.textContent = heartBtn.textContent === "♡" ? "❤️" : "♡";
    };

    // 📄 Details
    card.querySelector(".details-btn").onclick = () => openTripModal(dest);

    // 📦 Booking
    card.querySelector(".book-btn").onclick = () => bookTrip(dest);

    tripGrid.appendChild(card);
  });
}

// ================= BOOK =================
async function bookTrip(dest) {
  await addDoc(collection(db, "bookings"), {
    tripName: dest.name,
    price: dest.budget,
    status: "pending",
    time: new Date()
  });

  alert("Booking Successful 🎉");
}

// ================= MODAL =================
function openTripModal(dest) {
  tripModalContent.innerHTML = `
    <div style="position:relative;">
      <img class="trip-modal-img" src="${dest.image}">
      <button class="trip-modal-close" onclick="closeTripModal()">✕</button>
    </div>

    <div class="trip-modal-body">
      <h2>${dest.name}</h2>
      <p>${dest.budget}</p>
      <p>${dest.days}</p>

      <button class="trip-btn trip-btn-primary" onclick="bookTripNow('${dest.name}')">
        Book Now
      </button>
    </div>
  `;

  tripModal.classList.add("show");
}

window.closeTripModal = function () {
  tripModal.classList.remove("show");
};

window.bookTripNow = async function (name) {
  await addDoc(collection(db, "bookings"), {
    tripName: name,
    status: "pending"
  });

  alert("Booked 🚀");
};

// ================= FILTER =================
tripFilterButtons.forEach(btn => {
  btn.onclick = () => {
    document.querySelector(".trip-filter-btn.active").classList.remove("active");
    btn.classList.add("active");
    currentTripFilter = btn.dataset.filter;
    renderTripsSection();
  };
});

// ================= SEARCH =================
tripSearchInput.oninput = renderTripsSection;

// INIT
loadTrips();
</script>
