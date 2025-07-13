
import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env file.
// This is crucial for standalone scripts like seeding.
config();

// This flag tracks whether the Firebase Admin SDK has been successfully initialized.
let isFirebaseInitialized = false;
let firebaseInitializationError: Error | null = null;

// The `firebase-admin` package is used for server-side communication with Firebase services.
// We check if the app has already been initialized to prevent errors on hot-reloads in development.
if (!admin.apps.length) {
  try {
    // These credentials are read from the environment variables, which should be stored
    // securely in your `.env` file. They are the "keys" that grant your app
    // permission to act on behalf of your Firebase project.
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    };
    
    // We only attempt to initialize Firebase if all three required credentials are present.
    // This prevents the app from crashing if the .env file is not set up.
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                ...serviceAccount,
                // The private key should be a multi-line string.
                // It is read directly from the environment variable.
                privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        isFirebaseInitialized = true;

    } else {
        // This is a helpful warning for developers during setup to let them know the backend is not connected.
        const missingKeys = [
            !serviceAccount.projectId && "FIREBASE_PROJECT_ID",
            !serviceAccount.clientEmail && "FIREBASE_CLIENT_EMAIL",
            !serviceAccount.privateKey && "FIREBASE_PRIVATE_KEY"
        ].filter(Boolean).join(', ');
        const errorMessage = `Firebase Admin credentials not set in .env. Missing: ${missingKeys || 'one or more keys'}.`;
        firebaseInitializationError = new Error(errorMessage);
        console.warn(errorMessage);
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    firebaseInitializationError = error instanceof Error ? error : new Error(String(error));
  }
} else {
    // If admin.apps.length is not 0, it means the app is already initialized.
    isFirebaseInitialized = true;
}

// Export the Firestore database instance.
let firestore: admin.firestore.Firestore;

if (isFirebaseInitialized) {
    // If initialization was successful, we can get a reference to the real Firestore service.
    firestore = admin.firestore();
} else {
    // If initialization failed, we create a "proxy" object for Firestore.
    // This proxy prevents the app from crashing on startup. Instead, it will throw a
    // helpful error only when a database operation (like `.collection()`) is actually attempted.
    // This provides a better developer experience during initial setup.
    firestore = new Proxy({}, {
        get(target, prop) {
            // Throw an error when any method is called on the uninitialized firestore object.
            // We ignore special properties that might be accessed during module inspection.
            if (typeof prop === 'string' && prop !== 'then' && prop !== 'catch') {
                 const baseMessage = 'Firebase is not initialized.';
                 const detailMessage = firebaseInitializationError ? `Details: ${firebaseInitializationError.message}` : 'Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set correctly in your .env file.';
                 throw new Error(`${baseMessage} ${detailMessage}`);
            }
            return undefined;
        },
    }) as admin.firestore.Firestore; // Cast to the correct type to satisfy TypeScript
}

export { firestore, isFirebaseInitialized };
