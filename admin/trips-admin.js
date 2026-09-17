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


// ==============================
// LOAD TRIPS
// ==============================

window.loadTrips = async function () {

  const tripList =
    document.getElementById("tripList");

  if (!tripList) return;

  tripList.innerHTML =
    "<p>Loading trips...</p>";

  try {

    const snapshot =
      await getDocs(
        collection(db, "trips")
      );

    if (snapshot.empty) {

      tripList.innerHTML =
        "<p>No trips found.</p>";

      return;
    }

    let html = "";

    snapshot.forEach((tripDoc) => {

      const trip =
        tripDoc.data();

      html += `

        <div class="admin-card">

          <h3>
            🧳 ${safeText(
              trip.title ||
              trip.name ||
              "Trip"
            )}
          </h3>

          <p>
            📍 From:
            ${safeText(
              trip.from || "N/A"
            )}
          </p>

          <p>
            📍 Destination:
            ${safeText(
              trip.destination ||
              trip.to ||
              "N/A"
            )}
          </p>

          <p>
            💰 Price:
            ₹${safeText(
              trip.price || 0
            )}
          </p>

          <p>
            📅 Date:
            ${safeText(
              trip.date || "N/A"
            )}
          </p>

          <p>
            👥 Seats:
            ${safeText(
              trip.seats || 0
            )}
          </p>

          <p>
            Status:
            ${safeText(
              trip.status || "Active"
            )}
          </p>


          <div class="admin-actions">

            <button
              onclick="editTrip(
                '${tripDoc.id}'
              )">

              ✏️ Edit

            </button>


            <button
              onclick="deleteTrip(
                '${tripDoc.id}'
              )">

              🗑️ Delete

            </button>

          </div>

        </div>

      `;
    });

    tripList.innerHTML = html;

  } catch (error) {

    console.error(
      "Trips error:",
      error
    );

    tripList.innerHTML =
      "<p>Error loading trips.</p>";
  }
};


// ==============================
// ADD TRIP
// ==============================

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

  const seats =
    document.getElementById("tripSeats")
      ?.value;


  if (
    !title ||
    !from ||
    !destination ||
    !price
  ) {

    alert(
      "Please fill required fields."
    );

    return;
  }


  try {

    await addDoc(
      collection(db, "trips"),
      {

        title,

        from,

        destination,

        price: Number(price),

        date: date || "",

        seats: Number(seats || 0),

        status: "Active",

        createdAt:
          serverTimestamp()

      }
    );


    alert(
      "Trip added successfully!"
    );


    document.getElementById(
      "tripForm"
    )?.reset();


    loadTrips();

  } catch (error) {

    console.error(error);

    alert(
      "Error: " +
      error.message
    );
  }
};


// ==============================
// DELETE TRIP
// ==============================

window.deleteTrip =
async function (id) {

  if (
    !confirm(
      "Delete this trip?"
    )
  ) {
    return;
  }


  try {

    await deleteDoc(
      doc(db, "trips", id)
    );


    alert(
      "Trip deleted."
    );


    loadTrips();

  } catch (error) {

    console.error(error);

    alert(
      error.message
    );
  }
};


// ==============================
// EDIT TRIP
// ==============================

window.editTrip =
async function (id) {

  const title =
    prompt(
      "Enter new trip name:"
    );

  if (!title) return;


  try {

    await updateDoc(
      doc(db, "trips", id),
      {
        title: title,
        updatedAt:
          serverTimestamp()
      }
    );


    alert(
      "Trip updated."
    );


    loadTrips();

  } catch (error) {

    console.error(error);

    alert(
      error.message
    );
  }
};


// ==============================
// SAFE TEXT
// ==============================

function safeText(value) {

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

loadTrips();
