// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, getDocs } from 'firebase/firestore';// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGfwzx79sM28a5db-Tk2d16iXuKB89QXE",
  authDomain: "mindtales-1833c.firebaseapp.com",
  projectId: "mindtales-1833c",
  storageBucket: "mindtales-1833c.firebasestorage.app",
  messagingSenderId: "639775002478",
  appId: "1:639775002478:web:9cf6d2869a93a98226fb7f",
  measurementId: "G-PHWPDSWM94"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  export { db, collection, addDoc, setDoc, doc, getDocs };