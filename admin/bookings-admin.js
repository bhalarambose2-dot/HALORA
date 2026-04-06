import { db } from "../js/firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const bookingList = document.getElementById("bookingList");

// =============================
// LOAD BOOKINGS
// =============================
window.loadBookings = async function () {
  bookingList.innerHTML = "<p>Loading bookings...</p>";

  const statusFilter = document.getElementById("statusFilter").value;
  const typeFilter = document.getElementById("typeFilter").value;

  try {
    const snap = await getDocs(collection(db, "bookings"));
    let html = "";

    snap.forEach((docSnap) => {
      const b = docSnap.data();
      const id = docSnap.id;

      // FILTER LOGIC
      if (statusFilter && b.status !== statusFilter) return;
      if (typeFilter && b.type !== typeFilter) return;

      html += `
        <div class="admin-card">
          <h3>${b.type || "Booking"}</h3>
          <p><strong>User:</strong> ${b.userName || "Unknown"}</p>
          <p><strong>Service:</strong> ${b.serviceType || "-"}</p>
          <p><strong>From:</strong> ${b.pickup || "-"}</p>
          <p><strong>To:</strong> ${b.drop || "-"}</p>
          <p><strong>Amount:</strong> ₹${b.amount || 0}</p>
          <p><strong>Status:</strong> ${b.status || "Pending"}</p>
          <p><strong>Payment:</strong> ${b.paymentStatus || "Pending"}</p>

          <div class="admin-actions">
            <select onchange="updateStatus('${id}', this.value)">
              <option value="">Change Status</option>
              <option value="Approved">Approve</option>
              <option value="Completed">Complete</option>
              <option value="Rejected">Reject</option>
            </select>

            <button onclick="deleteBooking('${id}')">Delete</button>
          </div>
        </div>
      `;
    });

    bookingList.innerHTML = html || "<p>No bookings found</p>";

  } catch (error) {
    console.error(error);
    bookingList.innerHTML = "<p>Error loading bookings</p>";
  }
};

// =============================
// UPDATE STATUS
// =============================
window.updateStatus = async function (id, status) {
  if (!status) return;

  if (!confirm(`Change status to ${status}?`)) return;

  try {
    await updateDoc(doc(db, "bookings", id), {
      status: status,
      updatedAt: Date.now()
    });

    alert("Status updated");
    loadBookings();
  } catch (error) {
    alert(error.message);
  }
};

// =============================
// DELETE BOOKING
// =============================
window.deleteBooking = async function (id) {
  if (!confirm("Delete booking?")) return;

  try {
    await deleteDoc(doc(db, "bookings", id));
    alert("Deleted");
    loadBookings();
  } catch (error) {
    alert(error.message);
  }
};

// INITIAL LOAD
loadBookings();
