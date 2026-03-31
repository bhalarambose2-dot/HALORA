import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.submitWithdraw = async function () {
  const amount = Number(document.getElementById("amount").value);
  const upi = document.getElementById("upi").value.trim();
  const user = auth.currentUser;

  if (!amount || !upi) {
    alert("Please fill all fields");
    return;
  }

  try {
    const driverRef = doc(db, "drivers", user.uid);
    const driverSnap = await getDoc(driverRef);
    const driver = driverSnap.data();

    if (amount > Number(driver.wallet || 0)) {
      alert("Insufficient wallet balance");
      return;
    }

    await addDoc(collection(db, "withdrawRequests"), {
      driverId: user.uid,
      amount,
      upi,
      status: "pending",
      createdAt: serverTimestamp()
    });

    await updateDoc(driverRef, {
      wallet: Number(driver.wallet || 0) - amount
    });

    alert("Withdraw request submitted!");
    window.location.href = "wallet.html";
  } catch (e) {
    alert(e.message);
  }
};
