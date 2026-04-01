let userLat = 28.6139;
let userLng = 77.2090;

const map = L.map('map').setView([userLat, userLng], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker([userLat, userLng]).addTo(map)
  .bindPopup("Your Location")
  .openPopup();

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    userLat = position.coords.latitude;
    userLng = position.coords.longitude;

    map.setView([userLat, userLng], 15);
    marker.setLatLng([userLat, userLng]).bindPopup("Live Location").openPopup();

    window.userPickupLat = userLat;
    window.userPickupLng = userLng;
  });
}
