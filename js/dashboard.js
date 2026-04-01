import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let selectedService = "";
let selectedPrice = 0;
let selectedHotelName = "";
let selectedHotelPrice = 0;

// LOGOUT
window.logoutUser = async function () {
  await signOut(auth);
  window.location.href = "./login.html";
};

// BOTTOM NAV SECTION SWITCH
window.showSection = function (section) {
  document.querySelectorAll(".app-section").forEach(sec => sec.classList.remove("active-section"));

  document.getElementById("homeSection").style.display = "none";
  document.getElementById("tripsSection").style.display = "none";
  document.getElementById("bookingsSection").style.display = "none";
  document.getElementById("profileSection").style.display = "none";

  if (section === "home") document.getElementById("homeSection").style.display = "block";
  if (section === "trips") document.getElementById("tripsSection").style.display = "block";
  if (section === "bookings") document.getElementById("bookingsSection").style.display = "block";
  if (section === "profile") document.getElementById("profileSection").style.display = "block";

  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
  if (section === "home") document.querySelectorAll(".nav-item")[0].classList.add("active");
  if (section === "trips") document.querySelectorAll(".nav-item")[1].classList.add("active");
  if (section === "bookings") document.querySelectorAll(".nav-item")[2].classList.add("active");
  if (section === "profile") document.querySelectorAll(".nav-item")[3].classList.add("active");
};

// SELECT SERVICE
window.selectService = function (service, price) {
  selectedService = service;
  selectedPrice = price;

  document.getElementById("selectedService").innerText = `Selected: ${service}`;
  document.getElementById("bookingPrice").innerText = `₹${price}`;

  document.querySelectorAll(".service-box").forEach(box => {
    box.classList.remove("active");
    if (box.innerText.includes(service)) {
      box.classList.add("active");
    }
  });
};

// SELECT HOTEL
window.selectHotel = function (hotel, price) {
  selectedHotelName = hotel;
  selectedHotelPrice = price;

  document.getElementById("selectedHotel").innerText = `Selected Hotel: ${hotel}`;

  document.querySelectorAll(".hotel-card").forEach(card => {
    card.classList.remove("active");
    if (card.innerText.includes(hotel)) {
      card.classList.add("active");
    }
  });
};

// BOOK NOW
window.bookNow = async function () {
  const pickup = document.getElementById("pickup").value.trim();
  const drop = document.getElementById("drop").value.trim();
  const tripDate = document.getElementById("tripDate").value;

  if (!selectedService || !pickup || !drop || !tripDate) {
    alert("Please select service and fill all booking details");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Please login again");
    window.location.href = "./login.html";
    return;
  }

  try {
    await addDoc(collection(db, "bookings"), {
      userId: user.uid,
      type: "Ride",
      service: selectedService,
      price: selectedPrice,
      pickup,
      drop,
      tripDate,
      status: "Booked",
      createdAt: Date.now()
    });

    alert(`${selectedService} booked successfully!\nPrice: ₹${selectedPrice}`);
    loadBookings(user.uid);

    document.getElementById("pickup").value = "";
    document.getElementById("drop").value = "";
    document.getElementById("tripDate").value = "";
  } catch (error) {
    alert(error.message);
  }
};

// BOOK HOTEL
window.bookHotel = async function () {
  const hotelCity = document.getElementById("hotelCity").value.trim();
  const hotelDate = document.getElementById("hotelDate").value;

  if (!selectedHotelName || !hotelCity || !hotelDate) {
    alert("Please select hotel and fill all details");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Please login again");
    window.location.href = "./login.html";
    return;
  }

  try {
    await addDoc(collection(db, "bookings"), {
      userId: user.uid,
      type: "Hotel",
      service: selectedHotelName,
      price: selectedHotelPrice,
      pickup: hotelCity,
      drop: hotelCity,
      tripDate: hotelDate,
      status: "Hotel Booked",
      createdAt: Date.now()
    });

    alert(`${selectedHotelName} booked successfully!\nPrice: ₹${selectedHotelPrice}`);
    loadBookings(user.uid);

    document.getElementById("hotelCity").value = "";
    document.getElementById("hotelDate").value = "";
  } catch (error) {
    alert(error.message);
  }
};

// LOAD BOOKINGS
async function loadBookings(uid) {
  const bookingsWrap = document.getElementById("myBookings");
  const tripsWrap = document.getElementById("myTrips");
  const q = query(collection(db, "bookings"), where("userId", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    bookingsWrap.innerHTML = `<p class="muted">No bookings yet.</p>`;
    tripsWrap.innerHTML = `<p class="muted">No trips yet.</p>`;
    return;
  }

  let bookingHtml = "";
  let tripHtml = "";

  snap.forEach((docu) => {
    const b = docu.data();

    const cardHtml = `
      <div class="booking-item">
        <h3>${b.service}</h3>
        <p>${b.pickup} → ${b.drop}</p>
        <p>Date: ${b.tripDate}</p>
        <p>Status: ${b.status}</p>
        <strong>₹${b.price}</strong>
      </div>
    `;

    bookingHtml += cardHtml;
    tripHtml += cardHtml;
  });

  bookingsWrap.innerHTML = bookingHtml;
  tripsWrap.innerHTML = tripHtml;
}

// AUTH CHECK
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const data = snap.data();

    document.getElementById("userInfo").innerText = `${data.name} • ${data.email}`;
    document.getElementById("profileName").innerText = data.name;
    document.getElementById("profileEmail").innerText = data.email;
    document.getElementById("detailName").innerText = data.name;
    document.getElementById("detailEmail").innerText = data.email;

    const firstLetter = data.name?.charAt(0)?.toUpperCase() || "H";
    document.querySelector(".profile-circle").innerText = firstLetter;
    document.querySelector(".big-profile-circle").innerText = firstLetter;
  }

  loadBookings(user.uid);
  showSection("home");
});
