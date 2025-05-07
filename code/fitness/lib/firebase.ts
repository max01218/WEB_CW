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

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);

// Security bypass function for accepting member requests
export const bypassSecurityRules = async (data: {
  requestId: string;
  memberId: string;
  trainerId: string;
  trainerName: string;
  status: string;
}) => {
  try {
    // Use Cloud Function API path to handle request acceptance
    // Note: You need to implement the corresponding Cloud Function in your Firebase project
    const apiUrl = `https://us-central1-sportsclub6251.cloudfunctions.net/acceptMemberRequest`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Request accepted via Cloud Function:", result);
    return true;
  } catch (error) {
    console.error("Error in bypassSecurityRules:", error);
    // Create a custom event to log the error for later review
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('firebase-error', { 
        detail: { operation: 'accept-request', error, data } 
      });
      window.dispatchEvent(event);
    }
    return false;
  }
};

// Redirect request function for member reassignment
export const redirectRequest = async (data: {
  originalRequestId: string;
  memberId: string;
  memberName: string;
  originalTrainerId: string;
  originalTrainerName: string;
  alternativeTrainerId: string;
  alternativeTrainerName: string;
  trainingGoal: string;
}) => {
  try {
    // Use Cloud Function API path to handle request redirection
    const apiUrl = `https://us-central1-sportsclub6251.cloudfunctions.net/redirectMemberRequest`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Request redirected via Cloud Function:", result);
    return { success: true, result };
  } catch (error) {
    console.error("Error in redirectRequest:", error);
    // Create a custom event to log the error for later review
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('firebase-error', { 
        detail: { operation: 'redirect-request', error, data } 
      });
      window.dispatchEvent(event);
    }
    return { success: false, error };
  }
};

export { db, auth, database };

export default app; 