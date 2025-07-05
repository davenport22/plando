
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { auth, isClientConfigured } from '@/lib/firebase/client';
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
    if (!isClientConfigured) {
      setLoading(false);
      setProfileError("Firebase client is not configured. Please check your environment variables.");
      return;
    }

    // This is the single source of truth for auth state changes.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        setProfileError(null);
        try {
          // Attempt to get or create the user profile from the database
          const { profile, isNewUser: newUserStatus } = await getOrCreateUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
          });
          
          // If successful, set all user-related state
          setUser(firebaseUser);
          setUserProfile(profile);
          setIsNewUser(newUserStatus);
          
        } catch(e) {
          // If profile creation/retrieval fails, this is a critical error.
          // We keep the firebaseUser to show the error state, but clear the profile.
          console.error("Critical error during profile synchronization:", e);
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          
          setUser(firebaseUser); 
          setUserProfile(null);
          setIsNewUser(null);
          setProfileError(`Could not sync your profile. This is likely a server configuration issue. Details: ${errorMessage}`);
        } finally {
          setLoading(false);
        }
      } else {
        // User is signed out, so clear all state.
        setUser(null);
        setUserProfile(null);
        setIsNewUser(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount.

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // No state management needed here. onAuthStateChanged will handle everything.
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Error during sign-in with popup:", error);
         toast({
          title: "Sign-In Error",
          description: `Could not complete the sign-in process: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // No state management needed here. onAuthStateChanged will handle everything.
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
