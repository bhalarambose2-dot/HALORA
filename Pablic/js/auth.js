import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.signupUser = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;

  if (!email || !password || !name || !role) {
    alert("Please fill all fields");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    if (role === "customer") {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        name,
        role: "customer",
        wallet: 0,
        createdAt: serverTimestamp()
      });
      window.location.href = "customer.html";
    } else if (role === "driver") {
      await setDoc(doc(db, "drivers", user.uid), {
        uid: user.uid,
        email,
        name,
        role: "driver",
        online: false,
        earnings: 0,
        wallet: 0,
        approved: false,
        createdAt: serverTimestamp()
      });
      window.location.href = "documents.html";
    } else {
      alert("Admin signup disabled. Create admin manually in Firestore.");
    }
  } catch (e) {
    alert(e.message);
  }
};

window.loginUser = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const adminSnap = await getDoc(doc(db, "admins", user.uid));
    if (adminSnap.exists()) {
      window.location.href = "admin.html";
      return;
    }

    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      window.location.href = "customer.html";
      return;
    }

    const driverSnap = await getDoc(doc(db, "drivers", user.uid));
    if (driverSnap.exists()) {
      window.location.href = "driver.html";
      return;
    }

    alert("Profile not found");
  } catch (e) {
    alert(e.message);
  }
};
