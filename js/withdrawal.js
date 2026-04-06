// js/withdrawal.js

import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
});

window.requestWithdraw = async function () {
  const amount = Number(document.getElementById("withdrawAmount").value);
  const bankName = document.getElementById("bankName").value.trim();
  const accountNumber = document.getElementById("accountNumber").value.trim();

  if (!amount || amount < 100) {
    alert("Minimum withdraw is ₹100");
    return;
  }

  if (!bankName || !accountNumber) {
    alert("Please fill all details");
    return;
  }

  try {
    const walletRef = doc(db, "wallets", currentUser.uid);
    const walletSnap = await getDoc(walletRef);

    if (!walletSnap.exists()) {
      alert("Wallet not found");
      return;
    }

    const balance = walletSnap.data().balance || 0;

    if (balance < amount) {
      alert("Insufficient balance");
      return;
    }

    await addDoc(collection(db, "withdrawals"), {
      uid: currentUser.uid,
      amount,
      bankName,
      accountNumber,
      status: "Pending",
      createdAt: Date.now()
    });

    alert("Withdraw request submitted");
    window.location.href = "wallet.html";
  } catch (error) {
    alert(error.message);
  }
};
