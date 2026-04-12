const trips = [

/* NORTH INDIA */
{name:"Golden Triangle Express", days:"3N/4D", price:"₹3,500 - ₹18,000", place:"Delhi, Agra, Jaipur", img:"https://images.unsplash.com/photo-1564507592333-c60657eea523"},
{name:"Royal Rajasthan Tour", days:"6N/7D", price:"₹8,000 - ₹45,000", place:"Jaipur, Jodhpur, Udaipur", img:"https://images.unsplash.com/photo-1599661046827-dacff0c0f09a"},
{name:"Spiritual Varanasi", days:"2D", price:"₹1,600 - ₹11,000", place:"Varanasi", img:"https://images.unsplash.com/photo-1561361513-2d000a50f0dc"},
{name:"Amritsar Devotion", days:"2D", price:"₹1,800 - ₹12,000", place:"Golden Temple", img:"https://images.unsplash.com/photo-1588072432836-e10032774350"},
{name:"Himalayan Manali", days:"4D", price:"₹4,500 - ₹18,000", place:"Manali", img:"https://images.unsplash.com/photo-1626621341517-bbf3d9990a23"},
{name:"Shimla Kufri", days:"3D", price:"₹3,800 - ₹15,000", place:"Shimla", img:"https://images.unsplash.com/photo-1622308644420-b20142dc993c"},
{name:"Nainital Tour", days:"3D", price:"₹3,500 - ₹14,000", place:"Nainital", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"},
{name:"Mussoorie Trip", days:"3D", price:"₹3,500 - ₹14,000", place:"Mussoorie", img:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"},
{name:"Rishikesh Adventure", days:"3D", price:"₹2,500 - ₹13,000", place:"Rishikesh", img:"https://images.unsplash.com/photo-1549880338-65ddcdfd017b"},
{name:"Leh Ladakh", days:"7D", price:"₹12,000 - ₹55,000", place:"Ladakh", img:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429"},
{name:"Kashmir Paradise", days:"6D", price:"₹10,000 - ₹45,000", place:"Srinagar", img:"https://images.unsplash.com/photo-1506744038136-46273834b3fb"},
{name:"Dharamshala", days:"3D", price:"₹3,500 - ₹15,000", place:"Himachal", img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e"},
{name:"Mathura Vrindavan", days:"2D", price:"₹1,800 - ₹10,000", place:"Mathura", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"},
{name:"Ayodhya Tour", days:"2D", price:"₹1,800 - ₹10,000", place:"Ayodhya", img:"https://images.unsplash.com/photo-1518684079-3c830dcef090"},
{name:"Char Dham Yatra", days:"11D", price:"₹53,000", place:"Uttarakhand", img:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"},

/* NORTH EAST */
{name:"Darjeeling Delight", days:"4D", price:"₹5,000 - ₹20,000", place:"Darjeeling", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"},
{name:"Gangtok Tour", days:"4D", price:"₹6,000 - ₹25,000", place:"Sikkim", img:"https://images.unsplash.com/photo-1506744038136-46273834b3fb"},
{name:"Shillong Trip", days:"5D", price:"₹8,000 - ₹32,000", place:"Meghalaya", img:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429"},
{name:"Kaziranga Safari", days:"3D", price:"₹6,000 - ₹28,000", place:"Assam", img:"https://images.unsplash.com/photo-1472214103451-9374bd1c798e"},
{name:"Tawang Monastery", days:"6D", price:"₹12,000 - ₹48,000", place:"Arunachal", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"},

/* WEST INDIA */
{name:"Goa North", days:"4D", price:"₹4,500 - ₹22,000", place:"Goa", img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e"},
{name:"Goa South", days:"4D", price:"₹5,000 - ₹25,000", place:"Goa", img:"https://images.unsplash.com/photo-1500375592092-40eb2168fd21"},
{name:"Mumbai Darshan", days:"3D", price:"₹3,000 - ₹18,000", place:"Mumbai", img:"https://images.unsplash.com/photo-1567157577867-05ccb1388e66"},
{name:"Mahabaleshwar", days:"3D", price:"₹3,500 - ₹16,000", place:"Maharashtra", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"},
{name:"Gujarat Tour", days:"5D", price:"₹6,000 - ₹28,000", place:"Dwarka", img:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429"},

/* SOUTH INDIA */
{name:"Kerala Backwaters", days:"4D", price:"₹6,000 - ₹28,000", place:"Kerala", img:"https://images.unsplash.com/photo-1602216056096-3b40cc0c9944"},
{name:"Munnar Hills", days:"3D", price:"₹4,500 - ₹20,000", place:"Munnar", img:"https://images.unsplash.com/photo-1506744038136-46273834b3fb"},
{name:"Ooty Tour", days:"3D", price:"₹4,000 - ₹19,000", place:"Ooty", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"},
{name:"Kodaikanal", days:"3D", price:"₹4,000 - ₹19,000", place:"Tamil Nadu", img:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"},
{name:"Andaman Islands", days:"6D", price:"₹15,000 - ₹65,000", place:"Andaman", img:"https://images.unsplash.com/photo-1500375592092-40eb2168fd21"},

/* CENTRAL INDIA */
{name:"Khajuraho Orchha", days:"3D", price:"₹4,000 - ₹19,000", place:"MP", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"},
{name:"Bandhavgarh Tiger", days:"3D", price:"₹5,500 - ₹26,000", place:"MP", img:"https://images.unsplash.com/photo-1472214103451-9374bd1c798e"},
{name:"Kanha National Park", days:"3D", price:"₹5,500 - ₹26,000", place:"MP", img:"https://images.unsplash.com/photo-1472214103451-9374bd1c798e"},
{name:"Puri Konark", days:"3D", price:"₹3,500 - ₹16,000", place:"Odisha", img:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429"},
{name:"Bodhgaya", days:"3D", price:"₹3,000 - ₹15,000", place:"Bihar", img:"https://images.unsplash.com/photo-1501785888041-af3ef285b470"}

];
function loadTrips(data){
  let html = "";

  data.forEach(t=>{
    html += `
      <div class="card">
        <img src="${t.img}">
        <div class="card-content">
          <h3>${t.name}</h3>
          <p>📍 ${t.place}</p>
          <p>🕒 ${t.days}</p>
          <p>💰 ${t.price}</p>
          <button class="btn" onclick="openBooking('${t.name}')">Book Now</button>
        </div>
      </div>
    `;
  });

  document.getElementById("tripList").innerHTML = html;
}

/* PAGE LOAD */
loadTrips(trips);

/* SEARCH */
document.getElementById("search").addEventListener("input", e=>{
  let val = e.target.value.toLowerCase();
  let filtered = trips.filter(t=>t.name.toLowerCase().includes(val));
  loadTrips(filtered);
});

/* BOOKING */
let selectedTrip = "";

function openBooking(name){
  selectedTrip = name;
  document.getElementById("tripName").innerText = "Book: " + name;
  document.getElementById("bookingPopup").style.display = "flex";
}

function closePopup(){
  document.getElementById("bookingPopup").style.display = "none";
}

function confirmBooking(){
  let name = document.getElementById("name").value;
  let phone = document.getElementById("phone").value;
  let address = document.getElementById("address").value;

  if(!name || !phone || !address){
    alert("Fill all details!");
    return;
  }

  let booking = {trip:selectedTrip, name, phone, address};

  let all = JSON.parse(localStorage.getItem("bookings")) || [];
  all.push(booking);
  localStorage.setItem("bookings", JSON.stringify(all));

  alert("Booking Successful ✅");
  closePopup();
}
