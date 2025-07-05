
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function FirebaseClientConfigError() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/20 via-background to-accent/20 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-headline text-destructive">Action Required: Configure Client Credentials</CardTitle>
          <CardDescription>The application cannot connect to Firebase for login and authentication.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Firebase Client Configuration Missing</AlertTitle>
            <AlertDescription>
              <p>Your app is missing the necessary client-side Firebase credentials. These are different from the server credentials and are required for user authentication features like login and registration.</p>
              <p className="font-bold mt-4 mb-2">To fix this, add your client-side config to the `.env` file:</p>
              <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a>.</li>
                  <li>Select your project, then go to Project Settings (gear icon).</li>
                  <li>Under the "General" tab, scroll down to "Your apps".</li>
                  <li>Select your web app or create one if it doesn't exist.</li>
                  <li>In the app settings, find the "SDK setup and configuration" section and select "Config".</li>
                  <li>Copy the values for `apiKey`, `authDomain`, `projectId`, etc.</li>
                  <li>Paste them into your `.env` file, prefixed with `NEXT_PUBLIC_`:</li>
              </ol>
              <pre className="mt-2 text-xs bg-destructive-foreground/10 p-3 rounded font-mono whitespace-pre-wrap">
                {`NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."`}
              </pre>
              <p className="mt-4">After saving the `.env` file, the development server will automatically restart and apply the changes.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
