import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI",
  authDomain: "aerotech-ops.firebaseapp.com",
  projectId: "aerotech-ops",
  storageBucket: "aerotech-ops.firebasestorage.app",
  messagingSenderId: "645848371991",
  appId: "1:645848371961:web:4415c4d7623219fd31c828"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
