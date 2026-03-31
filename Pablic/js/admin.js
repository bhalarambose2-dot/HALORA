import { db } from "./firebase-config.js";
import { guardPage, bindLogout } from "./common.js";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.approveDriver = async function (driverId) {
  await updateDoc(doc(db, "drivers", driverId), { approved: true });
  alert("Driver approved");
};

window.rejectWithdraw = async function (reqId) {
  await updateDoc(doc(db, "withdrawRequests", reqId), { status: "rejected" });
  alert("Withdraw rejected");
};

window.approveWithdraw = async function (reqId) {
  await updateDoc(doc(db, "withdrawRequests", reqId), { status: "approved" });
  alert("Withdraw approved");
};

guardPage(async (user) => {
  bindLogout();

  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) {
    alert("Admin access denied");
    window.location.href = "login.html";
    return;
  }

  onSnapshot(collection(db, "users"), (snap) => {
    document.getElementById("totalCustomers").innerText = snap.size;
  });

  onSnapshot(collection(db, "drivers"), (snap) => {
    document.getElementById("totalDrivers").innerText = snap.size;

    const approvalList = document.getElementById("approvalList");
    const pending = snap.docs.filter(d => d.data().approved === false);

    if (pending.length === 0) {
      approvalList.innerHTML = "No pending approvals";
      return;
    }

    approvalList.innerHTML = "";
    pending.forEach(d => {
      const driver = d.data();
      approvalList.innerHTML += `
        <div class="mini-card">
          <h3>${driver.name || "Driver"} • ${driver.email || ""}</h3>
          <p>Aadhaar: ${driver.aadhaarNo || "-"}</p>
          <p>DL: ${driver.dlNo || "-"}</p>
          <p>RC: ${driver.rcNo || "-"}</p>
          <p>Vehicle No: ${driver.vehicleNumber || "-"}</p>
          <p>Vehicle Type: ${driver.vehicleType || "-"}</p>
          <p>UPI: ${driver.upiId || "-"}</p>
          <button class="main-btn" onclick="approveDriver('${d.id}')">Approve Driver</button>
        </div>
      `;
    });
  });

  onSnapshot(collection(db, "rides"), (snap) => {
    document.getElementById("totalRides").innerText = snap.size;
  });

  onSnapshot(collection(db, "withdrawRequests"), (snap) => {
    document.getElementById("totalWithdraws").innerText = snap.size;

    const withdrawList = document.getElementById("withdrawList");
    const pending = snap.docs.filter(d => d.data().status === "pending");

    if (pending.length === 0) {
      withdrawList.innerHTML = "No pending withdraws";
      return;
    }

    withdrawList.innerHTML = "";
    pending.forEach(d => {
      const req = d.data();
      withdrawList.innerHTML += `
        <div class="mini-card">
          <h3>Driver: ${req.driverId}</h3>
          <p>Amount: ₹${req.amount}</p>
          <p>UPI: ${req.upi}</p>
          <div class="row">
            <button class="main-btn" onclick="approveWithdraw('${d.id}')">Approve</button>
            <button class="danger-btn" onclick="rejectWithdraw('${d.id}')">Reject</button>
          </div>
        </div>
      `;
    });
  });
});
