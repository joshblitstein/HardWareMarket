// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeAQnBx42gTbNdEO60L4JFzPyiFOt51W4",
  authDomain: "nimbus-207d9.firebaseapp.com",
  projectId: "nimbus-207d9",
  storageBucket: "nimbus-207d9.firebasestorage.app",
  messagingSenderId: "452942433901",
  appId: "1:452942433901:web:3b013740a4784a24fcf964",
  measurementId: "G-VCTWMCE5HT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, analytics };
export default app;
