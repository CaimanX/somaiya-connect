import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace the following with YOUR project's config from the Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyA1O15qpMLj4inRRpqdJ05P6gG2tZnekhQ",
  authDomain: "somaiya-connect.firebaseapp.com",
  projectId: "somaiya-connect",
  storageBucket: "somaiya-connect.firebasestorage.app",
  messagingSenderId: "956212084636",
  appId: "1:956212084636:web:9aedd1c67645de76d99259",
  measurementId: "G-L8E0EHMJJG"
};

const app = initializeApp(firebaseConfig);

// Export the tools so we can use them in App.jsx
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);