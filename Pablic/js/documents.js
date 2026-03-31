import { auth, db, storage } from "./firebase-config.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { guardPage } from "./common.js";

async function uploadFile(file, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

window.uploadDocs = async function () {
  const user = auth.currentUser;
  const aadhaar = document.getElementById("aadhaar").files[0];
  const dl = document.getElementById("dl").files[0];
  const rc = document.getElementById("rc").files[0];
  const selfie = document.getElementById("selfie").files[0];
  const vehicle = document.getElementById("vehicle").files[0];

  if (!aadhaar || !dl || !rc || !selfie || !vehicle) {
    alert("Please upload all documents");
    return;
  }

  try {
    const aadhaarUrl = await uploadFile(aadhaar, `drivers/${user.uid}/aadhaar`);
    const dlUrl = await uploadFile(dl, `drivers/${user.uid}/dl`);
    const rcUrl = await uploadFile(rc, `drivers/${user.uid}/rc`);
    const selfieUrl = await uploadFile(selfie, `drivers/${user.uid}/selfie`);
    const vehicleUrl = await uploadFile(vehicle, `drivers/${user.uid}/vehicle`);

    await updateDoc(doc(db, "drivers", user.uid), {
      aadhaarUrl, dlUrl, rcUrl, selfieUrl, vehicleUrl,
      approved: false
    });

    document.getElementById("docStatus").innerText = "Documents uploaded! Wait for admin approval.";
    alert("Documents uploaded!");
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
