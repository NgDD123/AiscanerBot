// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { getFirestore, collection, getDocs, updateDoc, doc,addDoc,deleteDoc } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeP5wL3356ZOW8YgHtTMYKgTzbixlU9j0",
  authDomain: "freedmobot.firebaseapp.com",
  projectId: "freedmobot",
  storageBucket: "freedmobot.appspot.com",
  messagingSenderId: "942901798475",
  appId: "1:942901798475:web:b183eeb81c7448b8e4cfce",
  measurementId: "G-9HEGS6ZEWQ"
};

// Initialize Firebase
const app = initializeApp (firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth, collection, getDocs, updateDoc, doc,addDoc,deleteDoc };