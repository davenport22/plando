import { TripCard } from '@/components/trips/TripCard';
import { Button } from '@/components/ui/button';
import { firestore } from '@/lib/firebase';
import type { Trip } from '@/types';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default async function TripsPage() {
  let trips: Trip[] = [];
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
    // You could render an error message to the user here
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
      
      {trips.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground mb-4">You haven&apos;t created or joined any trips yet.</p>
          <Link href="/trips/new">
            <Button size="lg" variant="default">
              <PlusCircle className="mr-2 h-5 w-5" />
              Start Your First Trip
            </Button>
          </Link>
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
