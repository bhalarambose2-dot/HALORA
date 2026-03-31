import { db } from "./firebase-config.js";
import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.submitRating = async function () {
  const rideId = localStorage.getItem("rideId");
  const rating = Number(document.getElementById("rating").value);
  const review = document.getElementById("review").value.trim();

  if (!rideId) {
    alert("No recent ride found");
    return;
  }

  if (!rating || rating < 1 || rating > 5) {
    alert("Please enter rating between 1 and 5");
    return;
  }

  try {
    await updateDoc(doc(db, "rides", rideId), {
      rating,
      review
    });

    alert("Thanks for your feedback!");
    window.location.href = "history.html";
  } catch (e) {
    alert(e.message);
  }
};
