// ==========================================
// HALORA COMMON PACKAGE BOOKING SYSTEM
// Works for India + World + Kashmir packages
// ==========================================

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// वर्तमान में चुना गया package
let selectedPackage = null;


// ==========================================
// OPEN BOOKING
// ==========================================

window.bookPackage = function(name, price, destination = "India") {

  selectedPackage = {
    name: name,
    price: Number(price),
    destination: destination
  };

  // अगर booking section/page मौजूद है
  const section = document.getElementById("bookingSection");

  if (section) {
    section.style.display = "block";
    section.scrollIntoView({
      behavior: "smooth"
    });
  } else {
    // Package data को temporary save करके booking page खोलें
    localStorage.setItem(
      "haloraSelectedPackage",
      JSON.stringify(selectedPackage)
    );

    window.location.href = "booking.html";
  }
};


// ==========================================
// LOAD SELECTED PACKAGE
// ==========================================

window.loadSelectedPackage = function() {

  const saved = localStorage.getItem("haloraSelectedPackage");

  if (saved) {
    selectedPackage = JSON.parse(saved);
  }

  const packageName = document.getElementById("selectedPackageName");
  const packagePrice = document.getElementById("selectedPackagePrice");

  if (selectedPackage && packageName) {
    packageName.innerText = selectedPackage.name;
  }

  if (selectedPackage && packagePrice) {
    packagePrice.innerText =
      "₹" + selectedPackage.price.toLocaleString("en-IN");
  }
};


// ==========================================
// SAVE BOOKING TO FIREBASE
// ==========================================

window.submitPackageBooking = async function() {

  if (!selectedPackage) {
    alert("❌ Please select a package first.");
    return;
  }

  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  const date = document.getElementById("travelDate")?.value;
  const travellers = document.getElementById("travellers")?.value;
  const paymentMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value;

  if (!name || !phone || !date || !travellers) {
    alert("⚠️ Please fill all booking details.");
    return;
  }

  if (!paymentMethod) {
    alert("⚠️ Please select a payment method.");
    return;
  }

  try {

    const bookingData = {
      packageName: selectedPackage.name,
      destination: selectedPackage.destination,
      price: selectedPackage.price,

      customer: name,
      phone: phone,

      travelDate: date,
      travellers: Number(travellers),

      serviceType: "Trip",
      bookingType: "Package",

      paymentMethod: paymentMethod,
      paymentStatus: "Pending",

      status: "Pending",

      createdAt: serverTimestamp()
    };


    // 🔥 FIREBASE में booking save
    const docRef = await addDoc(
      collection(db, "bookings"),
      bookingData
    );


    // Local backup
    const localBookings = JSON.parse(
      localStorage.getItem("haloraBookings") || "[]"
    );

    localBookings.push({
      id: docRef.id,
      ...bookingData,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(
      "haloraBookings",
      JSON.stringify(localBookings)
    );


    alert(
      "✅ Booking saved successfully!\n\n" +
      "Package: " + selectedPackage.name +
      "\nBooking ID: " + docRef.id
    );


    // Form साफ करें
    document.getElementById("bookingForm")?.reset();

    // चयन हटाएं
    localStorage.removeItem("haloraSelectedPackage");

    // Admin panel में Firebase से booking automatically दिखाई देगी
    selectedPackage = null;

  } catch (error) {

    console.error(error);

    alert(
      "❌ Booking save नहीं हुई। Internet या Firebase settings check करके फिर try करें।"
    );
  }
};


// ==========================================
// AUTO LOAD PACKAGE ON PAGE OPEN
// ==========================================

document.addEventListener("DOMContentLoaded", function() {
  loadSelectedPackage();
});
