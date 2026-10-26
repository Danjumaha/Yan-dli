// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase Configuration for yan-dli
const firebaseConfig = {
  apiKey: "AIzaSyAcJ2YJQ0hz27M8CxuPiaqzIiCNdx8LvCY", // Added the 'J' back
  authDomain: "yan-dli.firebaseapp.com",
  databaseURL: "https://yan-dli-default-rtdb.firebaseio.com",
  projectId: "yan-dli",
  storageBucket: "yan-dli.firebasestorage.app",
  messagingSenderId: "538794949165",
  appId: "1:538794949165:web:7425a4ba4e915b7e6996a4"
};

// Initialize Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firestore Helpers and Services
export { 
  auth, 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  onSnapshot,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
};
