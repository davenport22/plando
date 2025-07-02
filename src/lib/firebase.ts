
import admin from 'firebase-admin';

let isFirebaseInitialized = false;

// Check if we have already initialized the app
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    };
    
    // Only initialize if all credentials are provided
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                ...serviceAccount,
                privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
            }),
        });
        isFirebaseInitialized = true;
    } else {
        // This is a helpful warning for developers during setup
        console.warn("Firebase Admin credentials not set in .env. Backend features will be disabled.");
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
    isFirebaseInitialized = true;
}

// If initialization was successful, export the real firestore instance.
// Otherwise, export a proxy that will throw a clear error when used.
let firestore: admin.firestore.Firestore;
if (isFirebaseInitialized) {
    firestore = admin.firestore();
} else {
    // This proxy prevents the app from crashing on startup if Firebase is not configured.
    // The error is deferred until an actual database operation is attempted.
    firestore = new Proxy({}, {
        get(target, prop) {
            // Throw a helpful error when any method (like .collection()) is called on the uninitialized firestore object.
            // We ignore special properties that might be accessed during module inspection.
            if (typeof prop === 'string' && prop !== 'then' && prop !== 'catch') {
                 throw new Error(
                    'Firebase is not initialized. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env file.'
                );
            }
            return undefined;
        },
    }) as admin.firestore.Firestore; // Cast to the correct type to satisfy TypeScript
}

export { firestore, isFirebaseInitialized };
