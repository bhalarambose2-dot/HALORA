// js/auth-guard.js

import { auth } from "./firebase-config.js";
import { loadCurrentUser } from "./session.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const protectedPages = [
  "dashboard.html",
  "customer.html",
  "driver.html",
  "partner.html",
  "wallet.html",
  "withdrawal.html",
  "profile-edit.html",
  "ride-live.html",
  "trips.html",
  "hotels.html"
];

const adminPages = [
  "admin-dashboard.html",
  "admin-users.html",
  "admin-bookings.html",
  "admin-drivers.html",
  "admin-hotels.html",
  "admin-wallet.html",
  "admin-withdrawals.html",
  "admin-reports.html",
  "admin-settings.html"
];

const currentPage = window.location.pathname.split("/").pop();

onAuthStateChanged(auth, async (user) => {
  const userData = await loadCurrentUser();

  if (protectedPages.includes(currentPage) && !user) {
    window.location.href = "login.html";
    return;
  }

  if (adminPages.includes(currentPage)) {
    if (!user || !userData || userData.role !== "admin") {
      alert("Access Denied: Admin only");
      window.location.href = "../login.html";
      return;
    }
  }

  if (currentPage === "driver.html" && userData?.role !== "driver") {
    alert("Driver access only");
    window.location.href = "dashboard.html";
  }

  if (currentPage === "partner.html" && userData?.role !== "partner") {
    alert("Partner access only");
    window.location.href = "dashboard.html";
  }
});

window.logoutUser = async function () {
  try {
    await signOut(auth);
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed");
  }
};
