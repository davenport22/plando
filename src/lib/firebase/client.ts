
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

// Initialize Firebase for client-side only to avoid server-side errors.
const app: FirebaseApp | undefined =
  typeof window !== 'undefined' && firebaseConfig.apiKey && !getApps().length
    ? initializeApp(firebaseConfig)
    : typeof window !== 'undefined' && firebaseConfig.apiKey
    ? getApp()
    : undefined;

// We only get auth if the app has been initialized
const auth: Auth | undefined = app ? getAuth(app) : undefined;

export { app, auth };
