
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, AlertTriangle, LogIn, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

// Inline SVG for Google icon for simplicity
const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.088,5.571l6.19,5.238C42.022,35.141,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

export default function LoginPage() {
  const { user, userProfile, loading, signInWithGoogle, isNewUser, profileError, logout } = useAuth();
  const router = useRouter();

  // Redirect effect - runs ONLY when a user is fully authenticated and there are no errors.
  useEffect(() => {
    if (user && userProfile && !profileError) {
      const destination = isNewUser ? '/profile/edit' : '/trips';
      router.replace(destination);
    }
  }, [user, userProfile, isNewUser, profileError, router]);


  // STATE 1: Loading
  // Show a spinner while the auth state is being determined. This is the default initial state.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying your identity...</p>
      </div>
    );
  }

  // STATE 2: Error
  // If we have an authenticated user but encountered an error creating their profile,
  // display a specific error card. This breaks the loop and gives the user a clear action.
  if (user && profileError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/20 via-background to-accent/20 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-headline text-destructive">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required: Server Configuration Error</AlertTitle>
              <AlertDescription>
                 <p>You have successfully logged in, but the app failed to create your user profile in the database. Please check the error details below and ensure your server's private credentials are correctly set in the <strong>.env</strong> file.</p>
                <pre className="mt-4 text-xs bg-destructive-foreground/10 p-3 rounded-md font-mono whitespace-pre-wrap">
                  {profileError}
                </pre>
                 <p className="mt-4">After updating the <strong>.env</strong> file, click the button below to sign out and try signing in again.</p>
              </AlertDescription>
            </Alert>
            <Button onClick={logout} variant="outline" className="w-full">
              Sign Out and Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATE 3: Redirecting
  // If the user is logged in and there's no error, but the redirection effect hasn't fired yet,
  // show a redirecting state. This prevents the login card from flashing before the redirect happens.
  if (user && userProfile && !profileError) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // STATE 4: Logged Out
  // If none of the above conditions are met, the user is not logged in. Show the main login card.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-headline">Welcome to Plando</CardTitle>
          <CardDescription>Stop Planning, Start Doing!</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <LoginForm />
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <Button 
                    variant="outline"
                    onClick={signInWithGoogle} 
                    className="w-full"
                >
                    <GoogleIcon />
                    Sign in with Google
                </Button>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?
                <Link href="/register" className="ml-1 text-primary hover:underline font-semibold">
                    Sign up
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
