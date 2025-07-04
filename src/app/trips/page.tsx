
import { TripCard } from '@/components/trips/TripCard';
import { Button } from '@/components/ui/button';
import { firestore } from '@/lib/firebase';
import type { Trip } from '@/types';
import { PlusCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function TripsPage() {
  let trips: Trip[] = [];
  let fetchError: string | null = null;

  try {
    const tripsSnapshot = await firestore.collection('trips').get();
    trips = tripsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Untitled Trip',
            destination: data.destination || 'Unknown',
            startDate: data.startDate || 'N/A',
            endDate: data.endDate || 'N/A',
            ownerId: data.ownerId || '',
            participantIds: data.participantIds || [],
            imageUrl: data.imageUrl,
        } as Trip;
    });
  } catch (error) {
    console.error("Failed to fetch trips from Firestore:", error);
    if (error instanceof Error) {
        fetchError = error.message;
    } else {
        fetchError = "An unknown error occurred while fetching trips."
    }
  }


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">My Trips</h1>
        <Link href="/trips/new">
          <Button size="lg">
            <PlusCircle className="mr-2 h-6 w-6" />
            Create New Trip
          </Button>
        </Link>
      </div>
      
      {fetchError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required: Configure Server Credentials</AlertTitle>
          <AlertDescription>
            <p>Could not fetch your trips because the app failed to connect to the database. This is because the server is not configured.</p>
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
            <p className="mt-4">After saving the `.env` file, the page will need to be refreshed.</p>
            <p className="mt-2 font-mono text-xs bg-destructive-foreground/10 p-2 rounded">Error details: {fetchError}</p>
          </AlertDescription>
        </Alert>
      ) : trips.length === 0 ? (
        <div className="text-center py-20 bg-muted/50 rounded-lg">
          <p className="text-xl text-muted-foreground">You haven&apos;t created or joined any trips yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Click "Create New Trip" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
