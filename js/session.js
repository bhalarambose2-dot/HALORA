// js/session.js

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.currentUserData = null;

export function getCurrentUserData() {
  return window.currentUserData;
}

export async function loadCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.currentUserData = null;
        resolve(null);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          window.currentUserData = {
            uid: user.uid,
            email: user.email,
            ...userSnap.data()
          };

          await updateDoc(userRef, {
            lastSeen: serverTimestamp()
          });

          resolve(window.currentUserData);
        } else {
          window.currentUserData = {
            uid: user.uid,
            email: user.email,
            role: "customer"
          };
          resolve(window.currentUserData);
        }
      } catch (error) {
        console.error("Session load error:", error);
        resolve(null);
      }
    });
  });
}
