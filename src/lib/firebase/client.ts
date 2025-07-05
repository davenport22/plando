
// IMPORTANT: Add these client-side Firebase config values to your .env file.
// You can find them in your Firebase project settings -> General -> Your apps -> Web app.
// Make sure to prefix them with NEXT_PUBLIC_ so they are available in the browser.
/*
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."
*/

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all necessary client-side config values are present.
// This provides a clearer error if the .env file is not set up.
const isClientConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

if (typeof window !== 'undefined' && !isClientConfigured) {
  console.error("Firebase client configuration is missing or incomplete. Please check your .env file for NEXT_PUBLIC_FIREBASE_... variables.");
}

// Initialize Firebase for client-side only.
let app: FirebaseApp;
let auth: Auth;

// This check prevents the app from crashing on import if firebase is not configured.
// The AuthContext will use `isClientConfigured` to render a helpful error boundary.
if (isClientConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
} else {
    // Provide dummy objects to prevent app crash on import.
    app = {} as FirebaseApp;
    auth = {} as Auth;
}


export { app, auth, isClientConfigured };
