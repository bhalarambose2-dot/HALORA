import { auth, db } from './auth.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const historyList = document.getElementById("historyList");

async function loadHistory() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);

  historyList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const booking = docSnap.data();
    historyList.innerHTML += `
      <div class="card">
        <h3>${booking.serviceType}</h3>
        <p>${booking.pickup} → ${booking.drop}</p>
        <p>₹${booking.price}</p>
        <p>Status: ${booking.status}</p>
      </div>
    `;
  });
}

setTimeout(loadHistory, 1500);
