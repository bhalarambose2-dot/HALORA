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
  collection,
  query,
  where,
  getDocs,
  getDoc
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
      kycStatus: "Pending",
      createdAt: Date.now()
    });

    alert("Signup successful!");
    window.location.href = "./dashboard.html";
  } catch (error) {
    alert("Signup Error: " + error.message);
    console.error(error);
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
    // 1. ADMIN CHECK
    // ==========================
    const adminRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      alert("Admin login successful!");
      window.location.href = "./admin/admin.html";
      return;
    }

    // ==========================
    // 2. PARTNER CHECK
    // ==========================
    const q = query(
      collection(db, "partners"),
      where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const partner = snapshot.docs[0].data();

      // APPROVED PARTNER
      if (partner.status === "Approved") {
        if (partner.partnerType === "driver") {
          alert("Driver login successful!");
          window.location.href = "./driver-panel.html";
          return;
        }

        if (partner.partnerType === "hotel") {
          alert("Hotel partner login successful!");
          window.location.href = "./hotel-dashboard.html";
          return;
        }

        if (partner.partnerType === "trip") {
          alert("Trip partner login successful!");
          window.location.href = "./trip-dashboard.html";
          return;
        }
      }

      // PENDING PARTNER
      if (partner.status === "Pending") {
        alert("Your partner request is pending approval.");
        window.location.href = "./dashboard.html";
        return;
      }

      // REJECTED PARTNER
      if (partner.status === "Rejected") {
        alert("Your partner request was rejected.");
        window.location.href = "./dashboard.html";
        return;
      }
    }

    // ==========================
    // 3. NORMAL USER
    // ==========================
    alert("Login successful!");
    window.location.href = "./dashboard.html";

  } catch (error) {
    alert("Login Error: " + error.message);
    console.error(error);
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
  "support.html",
  "offers.html",
  "notifications.html",

  "driver-panel.html",
  "driver-live.html",
  "driver-requests.html",

  "hotel-dashboard.html",
  "trip-dashboard.html",

  "admin.html",
  "admin-users.html",
  "admin-drivers.html",
  "admin-hotels.html",
  "admin-bookings.html",
  "admin-wallet.html",
  "admin-withdraw.html",
  "admin-support.html",
  "admin-reports.html",
  "admin-login.html"
];

const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage)) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "./login.html";
    }
  });
}
