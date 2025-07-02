import { NewTripForm } from '@/components/trips/NewTripForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isFirebaseInitialized } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewTripPage() {
  if (!isFirebaseInitialized) {
    return (
        <div className="container mx-auto py-12 px-4 max-w-2xl">
            <div className="mb-6">
                <Link href="/login" passHref>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Trips
                </Button>
                </Link>
            </div>
            <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backend Not Configured</AlertTitle>
            <AlertDescription>
                Trip creation is disabled because the Firebase backend has not been configured.
                Please set the required FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables in your .env file to enable this feature.
            </AlertDescription>
            </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-primary">Plan Your Next Adventure</CardTitle>
            <CardDescription className="text-lg">
              Fill in the details below to start planning your new trip with Plando.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewTripForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
