import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDr_5sW5Q4jfuHxqs-oALXWQu1iYc0NYXA",
  authDomain: "sportsclub6251.firebaseapp.com",
  projectId: "sportsclub6251",
  storageBucket: "sportsclub6251.firebasestorage.app",
  messagingSenderId: "421553169101",
  appId: "1:421553169101:web:440803f7e0bfdc41fcff84",
  measurementId: "G-0ZESYPGVJX",
  databaseURL: "https://sportsclub6251-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// 初始化 Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { db, auth, database };

export default app; 