import { auth, db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { guardPage } from "./common.js";

window.saveDocs = async function () {
  const user = auth.currentUser;

  const aadhaarNo = document.getElementById("aadhaarNo").value.trim();
  const dlNo = document.getElementById("dlNo").value.trim();
  const rcNo = document.getElementById("rcNo").value.trim();
  const vehicleNumber = document.getElementById("vehicleNumber").value.trim();
  const vehicleType = document.getElementById("vehicleType").value.trim();
  const upiId = document.getElementById("upiId").value.trim();

  if (!aadhaarNo || !dlNo || !rcNo || !vehicleNumber || !vehicleType || !upiId) {
    alert("Please fill all fields");
    return;
  }

  try {
    await updateDoc(doc(db, "drivers", user.uid), {
      aadhaarNo,
      dlNo,
      rcNo,
      vehicleNumber,
      vehicleType,
      upiId,
      approved: false
    });

    document.getElementById("docStatus").innerText =
      "Verification submitted! Wait for admin approval.";
    alert("Verification submitted successfully!");
  } catch (e) {
    alert(e.message);
  }
};

guardPage(async (user) => {
  const snap = await getDoc(doc(db, "drivers", user.uid));
  if (snap.exists()) {
    const d = snap.data();
    document.getElementById("docStatus").innerText = d.approved
      ? "Approved by admin"
      : "Pending admin approval";
  }
});
