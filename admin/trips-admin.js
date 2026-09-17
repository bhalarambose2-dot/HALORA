import { db } from "../js/firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================
// LOAD TRIPS
// =====================================

window.loadTrips = async function () {

  const tripList = document.getElementById("tripList");

  if (!tripList) return;

  tripList.innerHTML = "<p>Loading trips...</p>";

  try {

    const snapshot = await getDocs(
      collection(db, "trips")
    );

    if (snapshot.empty) {

      tripList.innerHTML =
        "<p>No trips found.</p>";

      return;
    }

    let html = "";

    snapshot.forEach((tripDoc) => {

      const trip = tripDoc.data();
      const id = tripDoc.id;

      const title =
        trip.title || trip.name || "Trip";

      const from =
        trip.from || "N/A";

      const destination =
        trip.destination ||
        trip.to ||
        "N/A";

      const price =
        trip.price || 0;

      const date =
        trip.date || "N/A";

      const endDate =
        trip.endDate || "N/A";

      const duration =
        trip.duration || "N/A";

      const seats =
        trip.seats || 0;

      const description =
        trip.description || "No description";

      const image =
        trip.image || "";

      const status =
        trip.status || "Active";


      html += `

        <div class="admin-card trip-card">

          ${
            image
              ? `
                <img
                  src="${safeText(image)}"
                  alt="${safeText(title)}"
                  style="
                    width:100%;
                    max-height:220px;
                    object-fit:cover;
                    border-radius:15px;
                    margin-bottom:15px;
                  "
                >
              `
              : ""
          }


          <h3>
            🧳 ${safeText(title)}
          </h3>


          <p>
            📍 <strong>From:</strong>
            ${safeText(from)}
          </p>


          <p>
            📍 <strong>Destination:</strong>
            ${safeText(destination)}
          </p>


          <p>
            📅 <strong>Start:</strong>
            ${safeText(date)}
          </p>


          <p>
            📅 <strong>End:</strong>
            ${safeText(endDate)}
          </p>


          <p>
            ⏱️ <strong>Duration:</strong>
            ${safeText(duration)}
          </p>


          <p>
            💰 <strong>Price:</strong>
            ₹${safeText(price)}
          </p>


          <p>
            👥 <strong>Seats:</strong>
            ${safeText(seats)}
          </p>


          <p>
            📝 <strong>Description:</strong><br>
            ${safeText(description)}
          </p>


          <p>
            <strong>Status:</strong>

            <span class="status">
              ${safeText(status)}
            </span>

          </p>


          <div class="admin-actions">

            <button
              onclick="editTrip('${id}')"
            >
              ✏️ Edit
            </button>


            <button
              onclick="toggleTripStatus(
                '${id}',
                '${status === "Active" ? "Inactive" : "Active"}'
              )"
            >
              ${
                status === "Active"
                  ? "⛔ Disable"
                  : "✅ Activate"
              }
            </button>


            <button
              onclick="deleteTrip('${id}')"
            >
              🗑️ Delete
            </button>

          </div>

        </div>

      `;
    });


    tripList.innerHTML = html;

  } catch (error) {

    console.error(
      "Trips loading error:",
      error
    );

    tripList.innerHTML =
      "<p>Error loading trips.</p>";
  }
};



// =====================================
// ADD TRIP
// =====================================

window.addTrip = async function () {

  const title =
    document.getElementById("tripTitle")
      ?.value.trim();

  const from =
    document.getElementById("tripFrom")
      ?.value.trim();

  const destination =
    document.getElementById("tripDestination")
      ?.value.trim();

  const price =
    document.getElementById("tripPrice")
      ?.value;

  const date =
    document.getElementById("tripDate")
      ?.value;

  const endDate =
    document.getElementById("tripEndDate")
      ?.value;

  const duration =
    document.getElementById("tripDuration")
      ?.value.trim();

  const seats =
    document.getElementById("tripSeats")
      ?.value;

  const image =
    document.getElementById("tripImage")
      ?.value.trim();

  const description =
    document.getElementById("tripDescription")
      ?.value.trim();


  if (
    !title ||
    !from ||
    !destination ||
    !price
  ) {

    alert(
      "Please fill all required fields."
    );

    return;
  }


  try {

    await addDoc(
      collection(db, "trips"),
      {

        title: title,

        from: from,

        destination: destination,

        price: Number(price),

        date: date || "",

        endDate: endDate || "",

        duration: duration || "",

        seats: Number(seats || 0),

        image: image || "",

        description:
          description || "",

        status: "Active",

        createdAt:
          serverTimestamp()

      }
    );


    alert(
      "✅ Trip added successfully!"
    );


    document
      .getElementById("tripForm")
      ?.reset();


    loadTrips();


  } catch (error) {

    console.error(
      "Add trip error:",
      error
    );

    alert(
      "Error: " +
      error.message
    );
  }
};



// =====================================
// EDIT TRIP
// =====================================

window.editTrip =
async function (id) {

  const title =
    prompt(
      "Enter new trip name:"
    );

  if (!title) return;


  const price =
    prompt(
      "Enter new price:",
      ""
    );


  if (!price) return;


  try {

    await updateDoc(
      doc(db, "trips", id),
      {

        title: title.trim(),

        price: Number(price),

        updatedAt:
          serverTimestamp()

      }
    );


    alert(
      "✅ Trip updated successfully!"
    );


    loadTrips();


  } catch (error) {

    console.error(
      "Edit trip error:",
      error
    );

    alert(
      "Error: " +
      error.message
    );
  }
};



// =====================================
// ACTIVE / INACTIVE
// =====================================

window.toggleTripStatus =
async function (id, newStatus) {

  try {

    await updateDoc(
      doc(db, "trips", id),
      {

        status: newStatus,

        updatedAt:
          serverTimestamp()

      }
    );


    alert(
      `Trip ${newStatus}`
    );


    loadTrips();


  } catch (error) {

    console.error(
      "Status error:",
      error
    );

    alert(
      error.message
    );
  }
};



// =====================================
// DELETE TRIP
// =====================================

window.deleteTrip =
async function (id) {

  if (
    !confirm(
      "⚠️ Delete this trip permanently?"
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(db, "trips", id)
    );


    alert(
      "🗑️ Trip deleted."
    );


    loadTrips();


  } catch (error) {

    console.error(
      "Delete trip error:",
      error
    );

    alert(
      error.message
    );
  }
};



// =====================================
// SAFE TEXT
// =====================================

function safeText(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



// =====================================
// INITIAL LOAD
// =====================================

loadTrips();
