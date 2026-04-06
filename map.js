// js/map.js

let map;
let driverMarker;
let pickupMarker;
let dropMarker;
let routeLine;

export function initMap(center = { lat: 26.9124, lng: 75.7873 }) {
  map = new google.maps.Map(document.getElementById("map"), {
    center,
    zoom: 13,
    disableDefaultUI: false
  });

  return map;
}

export function updateDriverMarker(position, title = "Driver") {
  if (!map) return;

  if (!driverMarker) {
    driverMarker = new google.maps.Marker({
      position,
      map,
      title,
      label: "D"
    });
  } else {
    driverMarker.setPosition(position);
  }
}

export function setPickupMarker(position) {
  if (!map) return;

  if (!pickupMarker) {
    pickupMarker = new google.maps.Marker({
      position,
      map,
      title: "Pickup",
      label: "P"
    });
  } else {
    pickupMarker.setPosition(position);
  }
}

export function setDropMarker(position) {
  if (!map) return;

  if (!dropMarker) {
    dropMarker = new google.maps.Marker({
      position,
      map,
      title: "Drop",
      label: "X"
    });
  } else {
    dropMarker.setPosition(position);
  }
}

export function drawSimpleRoute(driverPos, pickupPos, dropPos) {
  if (!map) return;

  if (routeLine) routeLine.setMap(null);

  routeLine = new google.maps.Polyline({
    path: [driverPos, pickupPos, dropPos],
    geodesic: true,
    strokeOpacity: 1.0,
    strokeWeight: 4,
    map
  });
}

export function focusMap(position) {
  if (!map) return;
  map.setCenter(position);
}
