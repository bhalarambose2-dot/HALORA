import { auth, db } from './auth.js';
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.bookTrip = function (tripTitle, amount) {
  if (!auth.currentUser) {
    alert("Please login first");
    return;
  }

  window.startRazorpayPayment(amount, async function () {
    try {
      await addDoc(collection(db, "tripBookings"), {
        userId: auth.currentUser.uid,
        tripTitle,
        amount,
        paymentStatus: "Paid",
        createdAt: new Date().toISOString()
      });

      alert(tripTitle + " booked successfully!");
    } catch (error) {
      alert(error.message);
    }
  });
};
