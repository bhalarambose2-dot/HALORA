// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "अपनी मौजूदा API KEY यहां रखो",
  authDomain: "halorebook.firebaseapp.com",
  projectId: "halorebook",
  storageBucket: "halorebook.firebasestorage.app",
  messagingSenderId: "अपनी मौजूदा Messaging Sender ID यहां रखो",
  appId: "अपनी मौजूदा App ID यहां रखो"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
