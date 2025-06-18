import { TripCard } from '@/components/trips/TripCard';
import { Button } from '@/components/ui/button';
import { MOCK_TRIPS } from '@/types';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function TripsPage() {
  // In a real app, fetch trips for the current user
  const trips = MOCK_TRIPS;

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
