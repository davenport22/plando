
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getOrCreateUserProfile } from '@/lib/actions';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If auth is not initialized (e.g., missing .env config), don't set up the listener.
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Ensure your NEXT_PUBLIC_FIREBASE... variables are set in .env");
      setLoading(false); // Stop the loading state.
      setIsConfigured(false);
      return;
    }
    
    setIsConfigured(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await getOrCreateUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
        });
        if (profile) {
            setUserProfile(profile);
        } else {
            // Handle case where profile couldn't be fetched/created
            console.error("Could not get or create user profile.");
            setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
        console.error("Firebase Auth is not initialized. Cannot sign in.");
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
      await signInWithPopup(auth, provider);
      // Successful sign-in is handled by the onAuthStateChanged listener
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      
      let description = "An unknown error occurred during sign-in.";
      if (error.code === 'auth/popup-closed-by-user') {
        description = "The sign-in window was closed before completing."
      } else if (error.code === 'auth/cancelled-popup-request') {
        description = "Multiple sign-in windows were opened. Please try again."
      } else if (error.code) {
        description = `Error: ${error.code}. Please check the console for more details.`
      }

      toast({
        title: "Sign-In Failed",
        description: description,
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

  const value = { user, userProfile, loading, isConfigured, signInWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
