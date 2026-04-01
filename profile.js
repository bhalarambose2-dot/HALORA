import { auth, db, onAuthStateChanged, doc, getDoc } from './auth.js';
import {
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      if (document.getElementById("profileName")) {
        document.getElementById("profileName").innerText = data.name || "No Name";
        document.getElementById("profileEmail").innerText = data.email || user.email;
        document.getElementById("walletBalance").innerText = data.wallet || 0;
        document.getElementById("kycStatus").innerText = data.kycStatus || "Pending";
      }

      if (document.getElementById("editName")) {
        document.getElementById("editName").value = data.name || "";
        document.getElementById("editPhone").value = data.phone || "";
      }
    }
  }
});

window.updateProfile = async function () {
  const user = auth.currentUser;
  if (!user) return alert("Login required");

  const name = document.getElementById("editName").value;
  const phone = document.getElementById("editPhone").value;

  try {
    await updateDoc(doc(db, "users", user.uid), {
      name,
      phone
    });

    alert("Profile updated successfully");
  } catch (error) {
    alert(error.message);
  }
};
