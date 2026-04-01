import { auth, db } from './auth.js';
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const hotelList = document.getElementById("hotelList");

async function loadHotels() {
  const snapshot = await getDocs(collection(db, "hotels"));
  hotelList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const hotel = docSnap.data();

    hotelList.innerHTML += `
      <div class="card">
        <h3>${hotel.name}</h3>
        <p>${hotel.city}</p>
        <p>₹${hotel.price}</p>
        <button class="main-btn" onclick="bookHotel('${docSnap.id}', '${hotel.name}', ${hotel.price})">Book Hotel</button>
      </div>
    `;
  });
}

window.bookHotel = async function (hotelId, hotelName, amount) {
  const user = auth.currentUser;
  if (!user) return alert("Login required");

  try {
    await addDoc(collection(db, "hotelBookings"), {
      userId: user.uid,
      hotelId,
      hotelName,
      checkIn: new Date().toISOString(),
      checkOut: new Date().toISOString(),
      guests: 2,
      amount,
      status: "Booked",
      createdAt: new Date().toISOString()
    });

    alert("Hotel booked successfully");
  } catch (error) {
    alert(error.message);
  }
};

loadHotels();
