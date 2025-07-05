
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
  const [profileError, setProfileError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const clientConfigured = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );
    
    if (!clientConfigured || !auth) {
        console.warn("Firebase client config missing or Auth failed to initialize. Ensure NEXT_PUBLIC_FIREBASE... variables are in .env");
        setLoading(false);
        return;
    }

    console.log("Setting up onAuthStateChanged listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged fired. firebaseUser:", firebaseUser);
      setLoading(true);
      if (firebaseUser) {
        console.log("User object received:", firebaseUser.uid);
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
          setProfileError(null);

        } catch(e) {
          console.error("Critical error during profile synchronization:", e);
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          
          setUser(firebaseUser); // Keep the authenticated user
          setUserProfile(null);
          setIsNewUser(null);
          setProfileError(`Could not sync your profile with the database. Error: ${errorMessage}`);
        }
      } else {
        console.log("No user object received. Clearing user state.");
        setUser(null);
        setUserProfile(null);
        setIsNewUser(null);
        setProfileError(null);
      }
      console.log("Finished processing auth state change. Setting loading to false.");
      setLoading(false); 
    });

    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    if (!auth) {
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
      setLoading(true);
      await signInWithRedirect(auth, provider);
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
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = { user, userProfile, isNewUser, loading, profileError, signInWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
