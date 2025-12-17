// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const admin = require("firebase-admin");
const {getAuth}  =require("firebase/auth");
const { getFirestore, collection, getDocs, getDoc, updateDoc, doc,addDoc,deleteDoc }  =require('firebase/firestore');
const { FIREBASE_ADMIN_CONFIG, FIREBASE_APP_CONFIG } = require("./config/env");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = JSON.parse(FIREBASE_APP_CONFIG)
// const serviceAccount=JSON.parse(FIREBASE_ADMIN_CONFIG)
var serviceAccount = require("./config/freedmobot-firebase-adminsdk-kyrjh-98c018a4d2.json")
function initFirebase() {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Initialize Firebase
const app = initializeApp (firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

module.exports ={ db, auth, collection, getDocs, getDoc, updateDoc, doc,addDoc,deleteDoc,initFirebase };