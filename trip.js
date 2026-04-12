/* =========================
HALORA TRIPS JS (FULL SYSTEM)
========================= */

/* 🔥 50 TRIPS DATA */
const trips = [
{name:"Golden Triangle", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?tajmahal"},
{name:"Rajasthan Tour", price:"₹8,000+", img:"https://source.unsplash.com/400x300/?jaipur"},
{name:"Varanasi", price:"₹1,600+", img:"https://source.unsplash.com/400x300/?varanasi"},
{name:"Amritsar", price:"₹1,800+", img:"https://source.unsplash.com/400x300/?golden-temple"},
{name:"Manali", price:"₹4,500+", img:"https://source.unsplash.com/400x300/?manali"},
{name:"Shimla", price:"₹3,800+", img:"https://source.unsplash.com/400x300/?shimla"},
{name:"Nainital", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?nainital"},
{name:"Mussoorie", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?mussoorie"},
{name:"Rishikesh", price:"₹2,500+", img:"https://source.unsplash.com/400x300/?rishikesh"},
{name:"Leh Ladakh", price:"₹12,000+", img:"https://source.unsplash.com/400x300/?ladakh"},
{name:"Kashmir", price:"₹10,000+", img:"https://source.unsplash.com/400x300/?kashmir"},
{name:"Dharamshala", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?dharamshala"},
{name:"Mathura", price:"₹1,800+", img:"https://source.unsplash.com/400x300/?mathura"},
{name:"Ayodhya", price:"₹1,800+", img:"https://source.unsplash.com/400x300/?ayodhya"},
{name:"Char Dham", price:"₹53,000+", img:"https://source.unsplash.com/400x300/?kedarnath"},

{name:"Darjeeling", price:"₹5,000+", img:"https://source.unsplash.com/400x300/?darjeeling"},
{name:"Gangtok", price:"₹6,000+", img:"https://source.unsplash.com/400x300/?gangtok"},
{name:"Shillong", price:"₹8,000+", img:"https://source.unsplash.com/400x300/?meghalaya"},
{name:"Kaziranga", price:"₹6,000+", img:"https://source.unsplash.com/400x300/?kaziranga"},
{name:"Tawang", price:"₹12,000+", img:"https://source.unsplash.com/400x300/?tawang"},
{name:"Ziro Valley", price:"₹8,000+", img:"https://source.unsplash.com/400x300/?ziro"},
{name:"Majuli", price:"₹5,000+", img:"https://source.unsplash.com/400x300/?majuli"},
{name:"Meghalaya Caves", price:"₹9,000+", img:"https://source.unsplash.com/400x300/?cave"},
{name:"Nagaland", price:"₹12,000+", img:"https://source.unsplash.com/400x300/?nagaland"},
{name:"Sikkim", price:"₹12,000+", img:"https://source.unsplash.com/400x300/?sikkim"},

{name:"Goa North", price:"₹4,500+", img:"https://source.unsplash.com/400x300/?goa"},
{name:"Goa South", price:"₹5,000+", img:"https://source.unsplash.com/400x300/?beach"},
{name:"Mumbai", price:"₹3,000+", img:"https://source.unsplash.com/400x300/?mumbai"},
{name:"Mahabaleshwar", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?mahabaleshwar"},
{name:"Gujarat", price:"₹6,000+", img:"https://source.unsplash.com/400x300/?dwarka"},
{name:"Rann of Kutch", price:"₹7,000+", img:"https://source.unsplash.com/400x300/?kutch"},
{name:"Diu", price:"₹5,500+", img:"https://source.unsplash.com/400x300/?diu"},
{name:"Nashik", price:"₹2,500+", img:"https://source.unsplash.com/400x300/?nashik"},
{name:"Aurangabad", price:"₹4,000+", img:"https://source.unsplash.com/400x300/?ellora"},
{name:"Daman", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?daman"},

{name:"Kerala", price:"₹6,000+", img:"https://source.unsplash.com/400x300/?kerala"},
{name:"Munnar", price:"₹4,500+", img:"https://source.unsplash.com/400x300/?munnar"},
{name:"Ooty", price:"₹4,000+", img:"https://source.unsplash.com/400x300/?ooty"},
{name:"Kodaikanal", price:"₹4,000+", img:"https://source.unsplash.com/400x300/?kodaikanal"},
{name:"Mysore", price:"₹5,500+", img:"https://source.unsplash.com/400x300/?mysore"},
{name:"Hampi", price:"₹4,000+", img:"https://source.unsplash.com/400x300/?hampi"},
{name:"Pondicherry", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?pondicherry"},
{name:"Chennai", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?chennai"},
{name:"Kanyakumari", price:"₹3,000+", img:"https://source.unsplash.com/400x300/?kanyakumari"},
{name:"Andaman", price:"₹15,000+", img:"https://source.unsplash.com/400x300/?andaman"},

{name:"Khajuraho", price:"₹4,000+", img:"https://source.unsplash.com/400x300/?khajuraho"},
{name:"Bandhavgarh", price:"₹5,500+", img:"https://source.unsplash.com/400x300/?tiger"},
{name:"Kanha", price:"₹5,500+", img:"https://source.unsplash.com/400x300/?forest"},
{name:"Puri", price:"₹3,500+", img:"https://source.unsplash.com/400x300/?puri"},
{name:"Bodhgaya", price:"₹3,000+", img:"https://source.unsplash.com/400x300/?bodhgaya"}
];

/* 🔥 LOAD TRIPS */
function loadTrips(data){
  let html="";
  data.forEach(t=>{
    html+=`
      <div class="card">
        <img src="${t.img}">
        <div class="card-content">
          <h3>${t.name}</h3>
          <p>${t.price}</p>
          <button class="btn" onclick="openBooking('${t.name}')">Book Now</button>
        </div>
      </div>
    `;
  });
  document.getElementById("tripList").innerHTML=html;
}

/* INITIAL LOAD */
loadTrips(trips);

/* 🔍 SEARCH */
document.getElementById("search").addEventListener("input", e=>{
  let val=e.target.value.toLowerCase();
  let filtered=trips.filter(t=>t.name.toLowerCase().includes(val));
  loadTrips(filtered);
});

/* 📦 BOOKING SYSTEM */
let selectedTrip="";

function openBooking(name){
  selectedTrip=name;
  document.getElementById("tripName").innerText="Book: "+name;
  document.getElementById("bookingPopup").style.display="flex";
}

function closePopup(){
  document.getElementById("bookingPopup").style.display="none";
}

function confirmBooking(){
  let name=document.getElementById("name").value;
  let phone=document.getElementById("phone").value;
  let address=document.getElementById("address").value;

  if(!name || !phone || !address){
    alert("Fill all details!");
    return;
  }

  let booking={
    trip:selectedTrip,
    name,
    phone,
    address,
    date:new Date().toLocaleString()
  };

  let all=JSON.parse(localStorage.getItem("bookings"))||[];
  all.push(booking);
  localStorage.setItem("bookings",JSON.stringify(all));

  alert("Booking Successful ✅");
  closePopup();
}
