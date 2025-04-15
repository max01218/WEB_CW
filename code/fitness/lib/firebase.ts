import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDAUsIMEBY90HLIUtTzv6iIUjeldsrjtrI",
    authDomain: "uosweb-50bcb.firebaseapp.com",
    projectId: "uosweb-50bcb",
    storageBucket: "uosweb-50bcb.firebasestorage.app",
    messagingSenderId: "1062467805978",
    appId: "1:1062467805978:web:ef76497ff69e323f5102a3",
    measurementId: "G-CSQVKCKTVX"
  };

// 初始化 Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; 