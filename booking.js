import { auth, db } from './auth.js';
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.saveRideBooking = async function () {
  const serviceType = document.getElementById("serviceType").value;
  const pickup = document.getElementById("pickup").value;
  const drop = document.getElementById("drop").value;
  const price = document.getElementById("price").value;

  const user = auth.currentUser;
  if (!user) {
    alert("Please login first");
    return;
  }

  if (!pickup || !drop || !price) {
    alert("Please fill all booking fields");
    return;
  }

  try {
    await addDoc(collection(db, "bookings"), {
      userId: user.uid,
      serviceType,
      pickup,
      drop,
      pickupLat: window.userPickupLat || 0,
      pickupLng: window.userPickupLng || 0,
      price: Number(price),
      status: "Pending",
      riderId: "",
      createdAt: new Date().toISOString()
    });

    alert("Ride booked successfully!");
  } catch (error) {
    alert(error.message);
  }
};
