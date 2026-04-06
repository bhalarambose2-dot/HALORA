import { auth, db } from "./js/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==============================
// Elements
// ==============================
const hotelName = document.getElementById("hotelName");
const hotelCity = document.getElementById("hotelCity");
const roomPrice = document.getElementById("roomPrice");
const hotelDescription = document.getElementById("hotelDescription");
const hotelStatus = document.getElementById("hotelStatus");
const hotelImage = document.getElementById("hotelImage");
const saveHotelBtn = document.getElementById("saveHotelBtn");

const totalHotelBookings = document.getElementById("totalHotelBookings");
const activeHotelStatus = document.getElementById("activeHotelStatus");
const roomPriceView = document.getElementById("roomPriceView");
const hotelCityView = document.getElementById("hotelCityView");
const hotelBookingsList = document.getElementById("hotelBookingsList");

let currentUser = null;

// ==============================
// Protect + Load
// ==============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "./login.html";
    return;
  }

  currentUser = user;
  await loadHotelData(user.uid);
  await loadHotelBookings(user.uid);
});

// ==============================
// Load Hotel Data
// ==============================
async function loadHotelData(uid) {
  try {
    const hotelRef = doc(db, "hotels", uid);
    const hotelSnap = await getDoc(hotelRef);

    if (hotelSnap.exists()) {
      const data = hotelSnap.data();

      hotelName.value = data.hotelName || "";
      hotelCity.value = data.city || "";
      roomPrice.value = data.roomPrice || "";
      hotelDescription.value = data.description || "";
      hotelStatus.value = data.status || "Inactive";
      hotelImage.value = data.image || "";

      activeHotelStatus.innerText = data.status || "Inactive";
      roomPriceView.innerText = data.roomPrice || 0;
      hotelCityView.innerText = data.city || "-";
    }
  } catch (error) {
    console.error("Load hotel error:", error);
    alert(error.message);
  }
}

// ==============================
// Save Hotel Data
// ==============================
saveHotelBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  try {
    await setDoc(doc(db, "hotels", currentUser.uid), {
      uid: currentUser.uid,
      hotelName: hotelName.value.trim(),
      city: hotelCity.value.trim(),
      roomPrice: Number(roomPrice.value || 0),
      description: hotelDescription.value.trim(),
      status: hotelStatus.value,
      image: hotelImage.value.trim(),
      updatedAt: Date.now()
    }, { merge: true });

    alert("Hotel details saved successfully!");

    activeHotelStatus.innerText = hotelStatus.value;
    roomPriceView.innerText = roomPrice.value || 0;
    hotelCityView.innerText = hotelCity.value || "-";
  } catch (error) {
    console.error("Save hotel error:", error);
    alert(error.message);
  }
});

// ==============================
// Load Hotel Bookings
// ==============================
async function loadHotelBookings(uid) {
  try {
    hotelBookingsList.innerHTML = "<p>Loading bookings...</p>";

    const q = query(collection(db, "hotelBookings"), where("hotelOwnerId", "==", uid));
    const snap = await getDocs(q);

    hotelBookingsList.innerHTML = "";
    totalHotelBookings.innerText = snap.size;

    if (snap.empty) {
      hotelBookingsList.innerHTML = "<p>No hotel bookings yet.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const booking = docSnap.data();

      hotelBookingsList.innerHTML += `
        <div class="booking-card">
          <h4>${booking.hotelName || "Hotel Booking"}</h4>
          <p><strong>Guest:</strong> ${booking.userName || "User"}</p>
          <p><strong>City:</strong> ${booking.city || "-"}</p>
          <p><strong>Room Price:</strong> ₹${booking.roomPrice || 0}</p>
          <p><strong>Check-in:</strong> ${booking.checkin || "-"}</p>
          <p><strong>Status:</strong> 
            <span class="badge ${String(booking.status || "pending").toLowerCase()}">
              ${booking.status || "Pending"}
            </span>
          </p>

          <div class="grid-2">
            <button class="main-btn" onclick="approveHotelBooking('${docSnap.id}')">Approve</button>
            <button class="main-btn" onclick="cancelHotelBooking('${docSnap.id}')">Cancel</button>
          </div>
        </div>
      `;
    });

  } catch (error) {
    console.error("Load hotel bookings error:", error);
    hotelBookingsList.innerHTML = "<p>Error loading bookings</p>";
  }
}

// ==============================
// Approve Booking
// ==============================
window.approveHotelBooking = async function (bookingId) {
  try {
    await updateDoc(doc(db, "hotelBookings", bookingId), {
      status: "Approved",
      updatedAt: Date.now()
    });

    alert("Booking approved");
    loadHotelBookings(currentUser.uid);
  } catch (error) {
    alert(error.message);
  }
};

// ==============================
// Cancel Booking
// ==============================
window.cancelHotelBooking = async function (bookingId) {
  try {
    await updateDoc(doc(db, "hotelBookings", bookingId), {
      status: "Cancelled",
      updatedAt: Date.now()
    });

    alert("Booking cancelled");
    loadHotelBookings(currentUser.uid);
  } catch (error) {
    alert(error.message);
  }
};
