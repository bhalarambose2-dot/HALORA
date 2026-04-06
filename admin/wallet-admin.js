// admin/wallet-admin.js

import { db } from "../js/firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const walletRequestsDiv = document.getElementById("walletRequests");

// =============================
// LOAD ALL REQUESTS
// =============================
async function loadWalletRequests() {
  walletRequestsDiv.innerHTML = "<p>Loading...</p>";

  try {
    const rechargeSnap = await getDocs(collection(db, "walletRequests"));
    const withdrawSnap = await getDocs(collection(db, "withdrawals"));

    let html = "";

    rechargeSnap.forEach((docSnap) => {
      const r = docSnap.data();

      html += `
        <div class="admin-card">
          <p><strong>Recharge</strong></p>
          <p>User: ${r.uid}</p>
          <p>Amount: ₹${r.amount}</p>
          <p>Status: ${r.status}</p>
          <button onclick="approveRecharge('${docSnap.id}', '${r.uid}', ${r.amount})">Approve</button>
        </div>
      `;
    });

    withdrawSnap.forEach((docSnap) => {
      const w = docSnap.data();

      html += `
        <div class="admin-card">
          <p><strong>Withdraw</strong></p>
          <p>User: ${w.uid}</p>
          <p>Amount: ₹${w.amount}</p>
          <p>Bank/UPI: ${w.bankName}</p>
          <p>Account: ${w.accountNumber}</p>
          <p>Status: ${w.status}</p>
          <button onclick="approveWithdraw('${docSnap.id}', '${w.uid}', ${w.amount})">Approve</button>
        </div>
      `;
    });

    walletRequestsDiv.innerHTML = html || "<p>No requests found</p>";
  } catch (error) {
    walletRequestsDiv.innerHTML = "<p>Error loading wallet requests</p>";
  }
}

// =============================
// APPROVE RECHARGE
// =============================
window.approveRecharge = async function (requestId, uid, amount) {
  try {
    const walletRef = doc(db, "wallets", uid);
    const walletSnap = await getDoc(walletRef);

    let currentBalance = 0;

    if (walletSnap.exists()) {
      currentBalance = walletSnap.data().balance || 0;
      await updateDoc(walletRef, {
        balance: currentBalance + amount
      });
    } else {
      await setDoc(walletRef, {
        uid,
        balance: amount,
        createdAt: Date.now()
      });
    }

    await updateDoc(doc(db, "walletRequests", requestId), {
      status: "Approved",
      approvedAt: Date.now()
    });

    await addDoc(collection(db, "transactions"), {
      uid,
      type: "Recharge",
      amount,
      status: "Success",
      createdAt: Date.now()
    });

    alert("Recharge approved");
    loadWalletRequests();
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// APPROVE WITHDRAW
// =============================
window.approveWithdraw = async function (withdrawId, uid, amount) {
  try {
    const walletRef = doc(db, "wallets", uid);
    const walletSnap = await getDoc(walletRef);

    if (!walletSnap.exists()) {
      alert("Wallet not found");
      return;
    }

    const currentBalance = walletSnap.data().balance || 0;

    if (currentBalance < amount) {
      alert("Insufficient wallet balance");
      return;
    }

    await updateDoc(walletRef, {
      balance: currentBalance - amount
    });

    await updateDoc(doc(db, "withdrawals", withdrawId), {
      status: "Approved",
      approvedAt: Date.now()
    });

    await addDoc(collection(db, "transactions"), {
      uid,
      type: "Withdraw",
      amount,
      status: "Success",
      createdAt: Date.now()
    });

    alert("Withdraw approved");
    loadWalletRequests();
  } catch (error) {
    alert(error.message);
  }
};

loadWalletRequests();
