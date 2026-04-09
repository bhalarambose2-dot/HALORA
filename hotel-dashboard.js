import { db, auth } from "./js/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ================= USER =================
let currentUser = null;
let hotelDocId = null;
let hotelData = null;

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  currentUser = user;
  document.getElementById("profileEmail").innerText = user.email;

  await loadHotelData();
});

// ================= LOAD HOTEL =================
async function loadHotelData() {
  const q = query(collection(db, "hotels"), where("uid", "==", currentUser.uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const docSnap = snapshot.docs[0];
  hotelDocId = docSnap.id;
  hotelData = docSnap.data();

  // PROFILE
  document.getElementById("profileHotelName").innerText = hotelData.hotelName || "HALORA HOTEL";
  document.getElementById("profileAvatar").innerText =
    (hotelData.hotelName || "H").charAt(0).toUpperCase();

  // MANAGEMENT
  document.getElementById("editHotelName").value = hotelData.hotelName || "";
  document.getElementById("editCity").value = hotelData.city || "";
  document.getElementById("editContact").value = hotelData.contact || "";
  document.getElementById("editRooms").value = hotelData.availableRooms || "";
  document.getElementById("newRoomPrice").value = hotelData.roomPrice || "";

  // PROFILE EDIT PANEL
  const pName = document.getElementById("profileEditHotelName");
  const pCity = document.getElementById("profileEditCity");
  const pContact = document.getElementById("profileEditContact");

  if (pName) pName.value = hotelData.hotelName || "";
  if (pCity) pCity.value = hotelData.city || "";
  if (pContact) pContact.value = hotelData.contact || "";
}

// ================= EDIT PROFILE SAVE =================
window.saveProfile = async function () {
  if (!hotelDocId) return alert("Hotel not found");

  const name = document.getElementById("profileEditHotelName").value;
  const city = document.getElementById("profileEditCity").value;
  const contact = document.getElementById("profileEditContact").value;

  await updateDoc(doc(db, "hotels", hotelDocId), {
    hotelName: name,
    city: city,
    contact: contact
  });

  alert("Profile Updated ✅");
  loadHotelData();
};

// ================= KYC SAVE =================
window.saveKYC = async function () {
  const aadhar = document.getElementById("kycAadhar").value;
  const pan = document.getElementById("kycPan").value;

  await updateDoc(doc(db, "hotels", hotelDocId), {
    kycAadhar: aadhar,
    kycPan: pan,
    kycStatus: "Pending"
  });

  alert("KYC Submitted ✅");
};

// ================= PAYMENT SAVE =================
window.savePayment = async function () {
  const upi = prompt("Enter UPI ID");

  await updateDoc(doc(db, "hotels", hotelDocId), {
    upiId: upi
  });

  alert("UPI Updated ✅");
};

// ================= LOGOUT =================
window.logout = async function () {
  await signOut(auth);
  window.location.href = "./login.html";
};
