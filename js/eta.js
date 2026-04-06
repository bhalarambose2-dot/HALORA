// js/eta.js

function toRad(value) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateETA(distanceKm, avgSpeedKmH = 30) {
  const hours = distanceKm / avgSpeedKmH;
  const minutes = Math.ceil(hours * 60);
  return minutes;
}
