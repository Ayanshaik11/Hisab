import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
  // Import the functions you need from the SDKs you need
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCHtBMdyw81Bheqc4sf9VjnjwKavC5knt4",
    authDomain: "hisab-23600.firebaseapp.com",
    databaseURL: "https://hisab-23600-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hisab-23600",
    storageBucket: "hisab-23600.firebasestorage.app",
    messagingSenderId: "374364394252",
    appId: "1:374364394252:web:6765e412ae9b63b6c1ef29"
  };

  // Initialize Firebase
// Paste your own values from:
// Firebase Console → Project settings → General → Your apps → Web app → SDK setup and configuration

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
