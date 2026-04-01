export function calculatePrice(type, km) {
  if (type === "Bike") return 30 + km * 8;
  if (type === "Auto") return 40 + km * 12;
  if (type === "Taxi") return 60 + km * 18;
}
