// partner.js

import { auth, db } from "./js/firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===========================
// SAVE PARTNER APPLICATION
// ===========================
window.submitPartnerForm = async function (type) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  let data = {
    uid: user.uid,
    email: user.email || "",
    partnerType: type,
    status: "Pending",
    createdAt: Date.now()
  };

  try {
    if (type === "hotel") {
      data.hotelName = document.getElementById("hotelName").value.trim();
      data.city = document.getElementById("hotelCity").value.trim();
      data.phone = document.getElementById("hotelPhone").value.trim();

      if (!data.hotelName || !data.city || !data.phone) {
        alert("Please fill all hotel fields");
        return;
      }
    }

    if (type === "trip") {
      data.agencyName = document.getElementById("agencyName").value.trim();
      data.location = document.getElementById("agencyLocation").value.trim();
      data.phone = document.getElementById("agencyPhone").value.trim();

      if (!data.agencyName || !data.location || !data.phone) {
        alert("Please fill all trip fields");
        return;
      }
    }

    if (type === "driver") {
      data.name = document.getElementById("driverName").value.trim();
      data.phone = document.getElementById("driverPhone").value.trim();
      data.vehicleNumber = document.getElementById("vehicleNumber").value.trim();

      if (!data.name || !data.phone || !data.vehicleNumber) {
        alert("Please fill all driver fields");
        return;
      }
    }

    await addDoc(collection(db, "partners"), data);

    alert(type + " application submitted successfully!");

    window.location.href = "partner.html";

  } catch (error) {
    alert(error.message);
    console.error("Partner form error:", error);
  }
};
