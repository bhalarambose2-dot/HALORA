// js/wallet.js

import { auth, db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const walletBalance = document.getElementById("walletBalance");
const transactionsDiv = document.getElementById("transactions");

let currentUser = null;

// =============================
// AUTH
// =============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  await ensureWallet();
  loadWallet();
  loadTransactions();
});

// =============================
// ENSURE WALLET EXISTS
// =============================
async function ensureWallet() {
  const walletRef = doc(db, "wallets", currentUser.uid);
  const snap = await getDoc(walletRef);

  if (!snap.exists()) {
    await setDoc(walletRef, {
      uid: currentUser.uid,
      balance: 0,
      createdAt: Date.now()
    });
  }
}

// =============================
// LOAD WALLET
// =============================
async function loadWallet() {
  const walletRef = doc(db, "wallets", currentUser.uid);
  const snap = await getDoc(walletRef);

  if (snap.exists()) {
    walletBalance.textContent = snap.data().balance || 0;
  }
}

// =============================
// REQUEST RECHARGE
// =============================
window.requestRecharge = async function () {
  const amount = Number(document.getElementById("rechargeAmount").value);

  if (!amount || amount < 10) {
    alert("Minimum recharge is ₹10");
    return;
  }

  try {
    await addDoc(collection(db, "walletRequests"), {
      uid: currentUser.uid,
      type: "recharge",
      amount,
      status: "Pending",
      createdAt: Date.now()
    });

    alert("Recharge request submitted. Admin will approve.");
    document.getElementById("rechargeAmount").value = "";
    loadTransactions();
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// LOAD TRANSACTIONS
// =============================
async function loadTransactions() {
  transactionsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", currentUser.uid)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      transactionsDiv.innerHTML = "<p>No transactions yet</p>";
      return;
    }

    let html = "";
    snap.forEach((docSnap) => {
      const t = docSnap.data();

      html += `
        <div class="txn">
          <p><strong>${t.type}</strong> - ₹${t.amount}</p>
          <p>Status: ${t.status || "Success"}</p>
        </div>
      `;
    });

    transactionsDiv.innerHTML = html;
  } catch (error) {
    transactionsDiv.innerHTML = "<p>Error loading transactions</p>";
  }
}
