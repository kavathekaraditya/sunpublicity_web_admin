import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvJh-WS8IYMHZ0zzFg6k2SPOjkDE2zws8",
  authDomain: "fir-1aad8.firebaseapp.com",
  databaseURL: "https://fir-1aad8-default-rtdb.firebaseio.com",
  projectId: "fir-1aad8",
  storageBucket: "fir-1aad8.firebasestorage.app",
  messagingSenderId: "613059477350",
  appId: "1:613059477350:web:fb972046a1ed7c5dd892a7"
};
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
