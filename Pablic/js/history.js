import { auth, db } from "./firebase-config.js";
import { guardPage, currency, statusBadge } from "./common.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

guardPage(async (user) => {
  const historyList = document.getElementById("historyList");

  const qCustomer = query(
    collection(db, "rides"),
    where("customerId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(qCustomer, (snapshot) => {
    if (snapshot.empty) {
      historyList.innerHTML = "No rides found";
      return;
    }

    historyList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const ride = docSnap.data();
      historyList.innerHTML += `
        <div class="mini-card">
          <h3>${ride.pickup} → ${ride.drop}</h3>
          <p>Fare: ${currency(ride.fare)}</p>
          <p>Status: ${statusBadge(ride.status)}</p>
          <p>Rating: ${ride.rating ?? "-"}</p>
        </div>
      `;
    });
  });
});
