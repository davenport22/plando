
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User 
} from 'firebase/auth';
import { auth, isClientConfigured } from '@/lib/firebase/client';
import { getOrCreateUserProfile } from '@/lib/actions';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FirebaseClientConfigError } from '@/components/auth/FirebaseClientConfigError';

// Define a mapping for Firebase Auth error codes to user-friendly messages
const FIREBASE_ERROR_MESSAGES: { [key: string]: string } = {
  "auth/email-already-in-use": "This email address is already in use by another account.",
  "auth/invalid-email": "The email address is not valid.",
  "auth/operation-not-allowed": "Email/password accounts are not enabled.",
  "auth/weak-password": "The password is too weak.",
  "auth/user-disabled": "This user account has been disabled.",
  "auth/user-not-found": "No user found with this email.",
  "auth/wrong-password": "The password is not valid or the user does not have a password.",
  "auth/invalid-credential": "The credentials provided are invalid."
};

const getFriendlyAuthErrorMessage = (errorCode: string) => {
    return FIREBASE_ERROR_MESSAGES[errorCode] || "An unexpected authentication error occurred. Please try again.";
};


interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isNewUser: boolean | null;
  loading: boolean;
  profileError: string | null;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // If the client-side Firebase config is missing, render a helpful error page.
  // This prevents the app from crashing and guides the user to fix their .env file.
  if (!isClientConfigured) {
    return <FirebaseClientConfigError />;
  }

  useEffect(() => {
    // This is the single source of truth for auth state changes.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setProfileError(null);

      if (firebaseUser) {
        try {
          const { profile, isNewUser: newUserStatus } = await getOrCreateUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
          });
          
          setUser(firebaseUser);
          setUserProfile(profile);
          setIsNewUser(newUserStatus);
          
        } catch(e) {
          console.error("Critical error during profile synchronization:", e);
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          
          setUser(firebaseUser); 
          setUserProfile(null);
          setIsNewUser(null);
          setProfileError(errorMessage);
        }
      } else {
        // User is signed out, clear all state.
        setUser(null);
        setUserProfile(null);
        setIsNewUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Error during sign-in with popup:", error);
        throw new Error(getFriendlyAuthErrorMessage(error.code));
      }
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged listener will handle the rest, including profile creation.
        // We just need to make sure the display name is available for the initial profile creation.
        // NOTE: Firebase does not automatically update the user object on creation.
        // We will pass the name to getOrCreateUserProfile which will use it if displayName is null.
    } catch (error: any) {
        console.error("Error during email registration:", error);
        throw new Error(getFriendlyAuthErrorMessage(error.code));
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        console.error("Error during email login:", error);
        throw new Error(getFriendlyAuthErrorMessage(error.code));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = { user, userProfile, isNewUser, loading, profileError, signInWithGoogle, registerWithEmail, loginWithEmail, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
