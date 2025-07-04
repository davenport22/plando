
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
          <AlertTitle>Error Connecting to Database</AlertTitle>
          <AlertDescription>
            <p>Could not fetch your trips. This usually happens when the application can't connect to the Firestore database.</p>
            <p className="mt-2"><strong>Action required:</strong> Please ensure your server-side Firebase credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`) are correctly set in your `.env` file. Instructions are in the `README.md` file.</p>
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
