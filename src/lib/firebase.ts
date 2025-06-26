
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAPRZBxqTRIs8Y03e-AK6IjRKWIYhdxWzs",
  authDomain: "heal-e-healthapp.firebaseapp.com",
  projectId: "heal-e-healthapp",
  storageBucket: "heal-e-healthapp.firebasestorage.app",
  messagingSenderId: "788471354165",
  appId: "1:788471354165:web:4a686d002c89ad6cb2f27c",
  measurementId: "G-171SBF2ZXB"
 
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

