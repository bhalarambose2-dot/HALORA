import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================
// SIGNUP
// ==========================
window.signupUser = async function () {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    await setDoc(doc(db, "users", uid), {
      name,
      email,
      wallet: 0,
      role: email === "bhalarambose2@gmail.com" ? "admin" : "user",
      kycStatus: "Pending",
      createdAt: Date.now()
    });

    alert("Signup successful!");
    window.location.href = "./dashboard.html";
  } catch (error) {
    alert("Signup Error: " + error.message);
    console.error("SIGNUP ERROR:", error);
  }
};

// ==========================
// LOGIN
// ==========================
window.loginUser = async function () {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // ==========================
    // 1. ADMIN EMAIL CHECK
    // ==========================
    const adminEmails = ["bhalarambose2@gmail.com"];

    if (adminEmails.includes(user.email)) {
      alert("Admin login successful!");
      window.location.href = "./admin/admin.html";
      return;
    }

    // ==========================
    // 2. USER DOC CHECK
    // ==========================
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().role === "admin") {
      alert("Admin login successful!");
      window.location.href = "./admin/admin.html";
      return;
    }

    // ==========================
    // 3. APPROVED PARTNER CHECK
    // ==========================
    const partnerQuery = query(
      collection(db, "partners"),
      where("uid", "==", user.uid),
      where("status", "==", "Approved")
    );

    const partnerSnap = await getDocs(partnerQuery);

    if (!partnerSnap.empty) {
      const partner = partnerSnap.docs[0].data();
      const type = (partner.partnerType || "").toLowerCase();

      // DRIVER
      if (
        type.includes("bike") ||
        type.includes("driver") ||
        type.includes("rider")
      ) {
        alert("Driver login successful!");
        window.location.href = "./driver-panel.html";
        return;
      }

      // HOTEL
      if (type.includes("hotel")) {
        alert("Hotel login successful!");
        window.location.href = "./hotel-dashboard.html";
        return;
      }

      // TRIP
      if (type.includes("trip")) {
        alert("Trip partner login successful!");
        window.location.href = "./trip-dashboard.html";
        return;
      }
    }

    // ==========================
    // 4. PENDING PARTNER CHECK
    // ==========================
    const pendingQuery = query(
      collection(db, "partners"),
      where("uid", "==", user.uid),
      where("status", "==", "Pending")
    );

    const pendingSnap = await getDocs(pendingQuery);

    if (!pendingSnap.empty) {
      alert("Your partner request is pending approval.");
      window.location.href = "./dashboard.html";
      return;
    }

    // ==========================
    // 5. NORMAL USER
    // ==========================
    alert("Login successful!");
    window.location.href = "./dashboard.html";

  } catch (error) {
    alert("Login Error: " + error.message);
    console.error("LOGIN ERROR FULL:", error);
  }
};

// ==========================
// RESET PASSWORD
// ==========================
window.resetPassword = async function () {
  const email = document.getElementById("resetEmail")?.value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent to your email");
    window.location.href = "./login.html";
  } catch (error) {
    alert("Reset Error: " + error.message);
    console.error(error);
  }
};

// ==========================
// LOGOUT
// ==========================
window.logoutUser = async function () {
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch (error) {
    alert("Logout Error: " + error.message);
  }
};

// ==========================
// PROTECT PAGES
// ==========================
const protectedPages = [
  "dashboard.html",
  "trip.html",
  "bookings.html",
  "wallet.html",
  "profile.html",
  "partner.html",
  "track-ride.html",
  "bike-booking.html",
  "driver-panel.html",
  "driver-live.html",
  "driver-requests.html",
  "hotel-dashboard.html",
  "trip-dashboard.html",
  "admin.html",
  "admin-wallet.html"
];

const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "./login.html";
    }
  });
}
