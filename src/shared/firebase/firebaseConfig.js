import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDakVTw38aVT5Szi0NCg3FTHyD6y0heXu8",
  authDomain: "sistema-boralli-v1.firebaseapp.com",
  projectId: "sistema-boralli-v1",
  storageBucket: "sistema-boralli-v1.firebasestorage.app",
  messagingSenderId: "27408903456",
  appId: "1:27408903456:web:f7a977ac185d35976b7b45",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);


export const storage = getStorage(app);
