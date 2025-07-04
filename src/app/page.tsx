
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const { user, loading, signInWithGoogle, isConfigured, isNewUser, profileError, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait until loading is complete

    // If there's a profile error, we won't redirect. The UI will show the error.
    if (profileError) return;

    if (user) {
      if (isNewUser === true) {
        router.push('/profile/edit'); // Redirect new users to edit their profile
      } else if (isNewUser === false) { // explicitly check for false to avoid redirect on null
        router.push('/trips'); // Redirect existing users to the main trips page
      }
      // If user exists but isNewUser is still null, we wait. The loading=true or profileError state will handle the UI.
    }
  }, [user, loading, isNewUser, profileError, router]);

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in but profile failed to load, show a specific error.
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
              <AlertTitle>Action Required: Configure Server Credentials</AlertTitle>
              <AlertDescription>
                <p>You have successfully logged in with Google, but the app failed to create your user profile in the database. This is because the server is not configured.</p>
                <p className="font-bold mt-4 mb-2">To fix this, add your server's private credentials to the `.env` file:</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Go to your Firebase Console &rarr; Project Settings &rarr; Service accounts.</li>
                  <li>Click <strong>Generate new private key</strong> and save the JSON file.</li>
                  <li>Open the file and copy the `project_id`, `client_email`, and `private_key`.</li>
                  <li>Paste them into your `.env` file like this:</li>
                </ol>
                <pre className="mt-2 text-xs bg-destructive-foreground/10 p-3 rounded font-mono whitespace-pre-wrap">
                  {`FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE...\\n-----END PRIVATE KEY-----\\n"`}
                </pre>
                 <p className="mt-4">After saving the `.env` file, click below to try again.</p>
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

  // If user is authenticated and everything is fine, show a redirecting state
  // while the useEffect hook prepares to navigate away.
  if (user && !profileError) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground">Redirecting...</p>
        </div>
      );
  }

  // Default state: not logged in, show the login card.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-headline">Welcome to Plando</CardTitle>
          <CardDescription>Stop Planning, Start Doing!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={signInWithGoogle} 
              size="lg" 
              className="w-full"
              disabled={!isConfigured}
            >
              <GoogleIcon />
              Sign in with Google
            </Button>
            
            {!isConfigured && (
              <div className="text-xs text-destructive text-center p-2 bg-destructive/10 rounded-md flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Client-side Firebase keys not found. Please add NEXT_PUBLIC variables to your .env file to enable login.</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2">
              By signing in, you agree to our (non-existent) Terms of Service and Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
