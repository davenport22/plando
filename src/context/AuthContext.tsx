
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, signInWithRedirect, GoogleAuthProvider, getRedirectResult, type User } from 'firebase/auth';
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
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Ensure your NEXT_PUBLIC_FIREBASE... variables are set in .env");
      setLoading(false);
      setIsConfigured(false);
      return;
    }
    
    setIsConfigured(true);
    
    // This handles the result of a sign-in redirect. It's called when the page
    // loads after the user has been redirected back from Google.
    getRedirectResult(auth)
      .catch((error) => {
        console.error("Error during sign-in redirect:", error);
        toast({
          title: "Sign-In Failed",
          description: `An error occurred during sign-in: ${error.message}`,
          variant: "destructive",
        });
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const result = await getOrCreateUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
        });
        if (result) {
            setUserProfile(result.profile);
            setIsNewUser(result.isNewUser);
        } else {
            console.error("Could not get or create user profile.");
            setUserProfile(null);
            setIsNewUser(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsNewUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

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
      // We initiate the redirect here. The result is handled by getRedirectResult in the useEffect hook.
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

  const value = { user, userProfile, isNewUser, loading, isConfigured, signInWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
