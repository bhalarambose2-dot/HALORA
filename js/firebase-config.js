// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJnOh92AYUzFeWtuLMtDciETdpCQ7-MNs",
  authDomain: "halorebook.firebaseapp.com",
  projectId: "halorebook",
  storageBucket: "halorebook.firebasestorage.app",
  messagingSenderId: "58132767978",
  appId: "1:58132767978:web:8136b579841652b15a6393",
  measurementId: "G-TDSM97W54X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
