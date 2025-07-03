
import admin from 'firebase-admin';

// This flag tracks whether the Firebase Admin SDK has been successfully initialized.
let isFirebaseInitialized = false;

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
                // The private key from the .env file has newline characters escaped as `\n`.
                // We need to replace them back to actual newlines for the key to be valid.
                privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
            }),
        });
        isFirebaseInitialized = true;
    } else {
        // This is a helpful warning for developers during setup to let them know the backend is not connected.
        console.warn("Firebase Admin credentials not set in .env. Backend features will be disabled.");
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
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
                 throw new Error(
                    'Firebase is not initialized. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env file.'
                );
            }
            return undefined;
        },
    }) as admin.firestore.Firestore; // Cast to the correct type to satisfy TypeScript
}

export { firestore, isFirebaseInitialized };
