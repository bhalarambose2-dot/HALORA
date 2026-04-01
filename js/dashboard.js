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

// LOGOUT
window.logoutUser = async function () {
  await signOut(auth);
  window.location.href = "./login.html";
};

// SELECT SERVICE
window.selectService = function (service, price) {
  selectedService = service;
  selectedPrice = price;

  document.getElementById("selectedService").innerText = `Selected: ${service}`;
  document.getElementById("bookingPrice").innerText = `₹${price}`;

  document.querySelectorAll(".service-box").forEach(box => {
    box.classList.remove("active");
    if (box.innerText.trim() === service) {
      box.classList.add("active");
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

// LOAD BOOKINGS
async function loadBookings(uid) {
  const bookingsWrap = document.getElementById("myBookings");
  const q = query(collection(db, "bookings"), where("userId", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    bookingsWrap.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  let html = "";
  snap.forEach((docu) => {
    const b = docu.data();
    html += `
      <div class="booking-item">
        <h3>${b.service}</h3>
        <p>${b.pickup} → ${b.drop}</p>
        <p>Date: ${b.tripDate}</p>
        <p>Status: ${b.status}</p>
        <strong>₹${b.price}</strong>
      </div>
    `;
  });

  bookingsWrap.innerHTML = html;
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
    document.getElementById("userInfo").innerText =
      `${data.name} • ${data.email}`;
  }

  loadBookings(user.uid);
});
