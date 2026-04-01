import { firebaseConfig } from '../firebase-config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addHotel = async function () {
  const name = document.getElementById("hotelName").value;
  const city = document.getElementById("hotelCity").value;
  const price = Number(document.getElementById("hotelPrice").value);
  const image = document.getElementById("hotelImage").value;

  if (!name || !city || !price || !image) {
    return alert("Fill all hotel fields");
  }

  try {
    await addDoc(collection(db, "hotels"), {
      name,
      city,
      price,
      image,
      status: "Active",
      createdAt: new Date().toISOString()
    });

    alert("Hotel added successfully");
    location.reload();
  } catch (error) {
    alert(error.message);
  }
};
