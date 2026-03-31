import { auth, db } from "./firebase-config.js";
import { guardPage, setText, currency } from "./common.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

guardPage(async (user) => {
  const driverSnap = await getDoc(doc(db, "drivers", user.uid));
  if (!driverSnap.exists()) {
    alert("Driver wallet not found");
    window.location.href = "driver.html";
    return;
  }

  const driver = driverSnap.data();
  setText("walletBalance", currency(driver.wallet || 0));
});
