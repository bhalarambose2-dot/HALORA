import { firebaseConfig } from './firebase-config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.sendOTP = function () {
  const phoneNumber = document.getElementById("phoneNumber").value;

  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'normal'
  });

  signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      alert("OTP sent");
    })
    .catch((error) => alert(error.message));
};

window.verifyOTP = function () {
  const code = document.getElementById("otpCode").value;

  window.confirmationResult.confirm(code)
    .then(() => {
      alert("Login success");
      window.location.href = "dashboard.html";
    })
    .catch((error) => alert(error.message));
};
