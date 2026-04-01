import { auth, db } from './auth.js';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.rechargeWallet = async function () {
  const amount = Number(document.getElementById("walletAmount").value);
  const user = auth.currentUser;

  if (!user) return alert("Login required");
  if (!amount || amount <= 0) return alert("Enter valid amount");

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const currentWallet = userSnap.data().wallet || 0;

    await updateDoc(userRef, {
      wallet: currentWallet + amount
    });

    await addDoc(collection(db, "walletTransactions"), {
      userId: user.uid,
      amount,
      type: "Credit",
      status: "Success",
      createdAt: new Date().toISOString()
    });

    alert("Wallet recharged successfully");
  } catch (error) {
    alert(error.message);
  }
};
