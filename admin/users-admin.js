import { db } from "../js/firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==============================
// LOAD USERS
// ==============================

window.loadUsers = async function () {

  const userList =
    document.getElementById("userList");

  const search =
    document.getElementById("userSearch")
      ?.value
      .trim()
      .toLowerCase() || "";

  userList.innerHTML =
    "<p>Loading users...</p>";

  try {

    const snapshot =
      await getDocs(
        collection(db, "users")
      );

    let html = "";
    let count = 0;


    snapshot.forEach((docSnap) => {

      const user =
        docSnap.data();

      const uid =
        docSnap.id;


      const name =
        user.name || "N/A";

      const email =
        user.email || "N/A";

      const phone =
        user.phone || "N/A";

      const role =
        user.role || "user";

      const kycStatus =
        user.kycStatus || "Pending";

      const accountStatus =
        user.accountStatus || "Active";


      // SEARCH

      const searchText =
        (
          name +
          " " +
          email +
          " " +
          phone
        ).toLowerCase();


      if (
        search &&
        !searchText.includes(search)
      ) {
        return;
      }


      count++;


      const isBlocked =
        accountStatus.toLowerCase() ===
        "blocked";


      html += `

        <div class="admin-card user-card">

          <h3>
            👤 ${escapeHTML(name)}
          </h3>

          <p>
            <strong>Email:</strong>
            ${escapeHTML(email)}
          </p>

          <p>
            <strong>Phone:</strong>
            ${escapeHTML(phone)}
          </p>

          <p>
            <strong>Role:</strong>
            ${escapeHTML(role)}
          </p>

          <p>
            <strong>KYC:</strong>
            <span class="status">
              ${escapeHTML(kycStatus)}
            </span>
          </p>

          <p>
            <strong>Account:</strong>
            <span class="status">
              ${escapeHTML(accountStatus)}
            </span>
          </p>

          <p>
            <strong>User ID:</strong><br>
            <small>${escapeHTML(uid)}</small>
          </p>


          <div class="admin-actions">

            <button
              onclick="toggleUserStatus(
                '${uid}',
                '${isBlocked ? "Active" : "Blocked"}'
              )">

              ${isBlocked
                ? "✅ Unblock"
                : "🚫 Block"}

            </button>


            <button
              onclick="deleteUser(
                '${uid}'
              )">

              🗑️ Delete

            </button>

          </div>

        </div>

      `;
    });


    if (count === 0) {

      userList.innerHTML =
        "<p>No users found</p>";

      return;
    }


    userList.innerHTML = html;


  } catch (error) {

    console.error(
      "Users loading error:",
      error
    );

    userList.innerHTML =
      "<p>Error loading users</p>";

  }

};


// ==============================
// BLOCK / UNBLOCK USER
// ==============================

window.toggleUserStatus =
async function (uid, newStatus) {

  try {

    await updateDoc(
      doc(db, "users", uid),
      {
        accountStatus: newStatus,
        updatedAt: Date.now()
      }
    );


    alert(
      `User ${newStatus}`
    );


    loadUsers();


  } catch (error) {

    console.error(error);

    alert(
      "Error: " +
      error.message
    );

  }

};


// ==============================
// DELETE USER
// ==============================

window.deleteUser =
async function (uid) {

  if (
    !confirm(
      "Delete this user's Firestore profile?"
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(db, "users", uid)
    );


    alert(
      "User deleted"
    );


    loadUsers();


  } catch (error) {

    console.error(error);

    alert(
      "Delete error: " +
      error.message
    );

  }

};


// ==============================
// SAFE HTML
// ==============================

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ==============================
// INITIAL LOAD
// ==============================

loadUsers();
