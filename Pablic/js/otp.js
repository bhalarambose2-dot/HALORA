import { db } from "./firebase-config.js";
import {
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function generateOTP(rideId) {
  const otp = Math.floor(1000 + Math.random() * 9000);
  await updateDoc(doc(db, "rides", rideId), { otp });
  return otp;
}

export async function verifyOTP(rideId, enteredOtp) {
  const rideSnap = await getDoc(doc(db, "rides", rideId));
  const data = rideSnap.data();

  if (!data) throw new Error("Ride not found");

  if (Number(enteredOtp) === Number(data.otp)) {
    await updateDoc(doc(db, "rides", rideId), { status: "started" });
    return true;
  }
  return false;
}
