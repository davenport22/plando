
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User 
} from 'firebase/auth';
import { auth, isClientConfigured } from '@/lib/firebase/client';
import { getUserProfile, getOrCreateUserProfile } from '@/lib/actions';
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
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: (prefetchedProfile?: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
      const pendingTripId = localStorage.getItem('pendingTripId');

      if (firebaseUser) {
        if (firebaseUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            setIsAdmin(true);
        }
        try {
          const { profile, isNewUser: newUserStatus } = await getOrCreateUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
          }, pendingTripId);
          
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
        } finally {
            if (pendingTripId) {
                localStorage.removeItem('pendingTripId');
            }
        }
      } else {
        // User is signed out, clear all state, unless we are in local admin mode.
        if (!isAdmin) {
            setUser(null);
            setUserProfile(null);
            setIsNewUser(null);
        }
        
        if (pendingTripId) {
            localStorage.removeItem('pendingTripId');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const safeToIgnoreErrors = [
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/user-cancelled'
      ];
      if (!safeToIgnoreErrors.includes(error.code)) {
        console.error("Error during sign-in with popup:", error);
        throw new Error(getFriendlyAuthErrorMessage(error.code));
      }
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    try {
        if (email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            throw new Error("This email is reserved for administration.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // After creating the user, immediately update their profile with the provided name.
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name });
        }
    } catch (error: any) {
        console.error("Error during email registration:", error);
        throw new Error(getFriendlyAuthErrorMessage(error.code) || error.message);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    // Special local admin check
    if (email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL && password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        setLoading(true);
        setIsAdmin(true);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
    }

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
    // Always reset admin state on logout
    setIsAdmin(false);
  };

  const refreshUserProfile = async (prefetchedProfile?: UserProfile) => {
    if (prefetchedProfile) {
        setUserProfile(prefetchedProfile);
        return;
    }
    if (!user) {
      return;
    }
    try {
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  const value = { user, userProfile, isNewUser, loading, profileError, isAdmin, signInWithGoogle, registerWithEmail, loginWithEmail, logout, refreshUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
