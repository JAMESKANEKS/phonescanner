import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxPDYR93pfqePmyE2OEjFhjEVnR2OMN2w",
  authDomain: "phonescanner-ba5ab.firebaseapp.com",
  projectId: "phonescanner-ba5ab",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
