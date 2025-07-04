
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithRedirect, GoogleAuthProvider, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getOrCreateUserProfile } from '@/lib/actions';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isNewUser: boolean | null;
  loading: boolean;
  isConfigured: boolean;
  profileError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const clientConfigured = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );
    setIsConfigured(clientConfigured);
    
    if (!clientConfigured || !auth) {
        console.warn("Firebase client config missing or Auth failed to initialize. Ensure NEXT_PUBLIC_FIREBASE... variables are in .env");
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Set loading to true whenever auth state is being checked to prevent UI flashes
      setLoading(true);

      if (firebaseUser) {
        try {
          // First, get or create the user profile from the backend.
          const { profile, isNewUser: newUserStatus } = await getOrCreateUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
          });

          // If successful, update all states together to present a consistent view.
          setUserProfile(profile);
          setIsNewUser(newUserStatus);
          setUser(firebaseUser); // Set Firebase user object last after profile is confirmed.
          setProfileError(null);

        } catch(e) {
          console.error("Critical error during profile synchronization:", e);
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          
          // In case of a profile error, we still have an authenticated user.
          // Set the error state so the UI can show a specific message.
          setUser(firebaseUser);
          setUserProfile(null);
          setIsNewUser(null);
          setProfileError(`Could not sync your profile with the database. Error: ${errorMessage}`);
        }
      } else {
        // User is signed out, clear all user-related state.
        setUser(null);
        setUserProfile(null);
        setIsNewUser(null);
        setProfileError(null);
      }
      // Signal that the entire auth process for this change is complete.
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isConfigured || !auth) {
        console.error("Firebase Auth is not configured. Cannot sign in.");
        toast({
          title: "Configuration Error",
          description: "Firebase is not set up correctly in the app.",
          variant: "destructive",
        });
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      // Set loading to true to indicate a sign-in process has started.
      setLoading(true);
      await signInWithRedirect(auth, provider);
      // The user will be redirected to Google. The onAuthStateChanged listener will
      // handle the result when they are redirected back to the app.
    } catch (error: any) {
      console.error("Error initiating sign-in with redirect:", error);
       toast({
        title: "Sign-In Error",
        description: `Could not start the sign-in process: ${error.message}`,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) {
      console.error("Firebase Auth is not initialized. Cannot sign out.");
      return;
    }
    try {
      await signOut(auth);
      // onAuthStateChanged will handle clearing user state.
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = { user, userProfile, isNewUser, loading, isConfigured, profileError, signInWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
