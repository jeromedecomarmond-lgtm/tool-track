import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAzYJOZ0LKB0U0285z6SYIEfEG5iIVe3cM",
  authDomain: "tool-track-e1a4f.firebaseapp.com",
  projectId: "tool-track-e1a4f",
  storageBucket: "tool-track-e1a4f.firebasestorage.app",
  messagingSenderId: "690653782812",
  appId: "1:690653782812:web:c5567cf848e882960910d9",
  measurementId: "G-4NBSJTQC9D"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
