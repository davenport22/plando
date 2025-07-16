
"use client";

import { useState, useEffect } from 'react';
import { TripCard } from '@/components/trips/TripCard';
import { Button } from '@/components/ui/button';
import { getTripsForUser, joinTripWithId } from '@/lib/actions';
import type { Trip } from '@/types';
import { PlusCircle, AlertCircle, Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function JoinTripForm({ onTripJoined }: { onTripJoined: () => void }) {
  const [tripId, setTripId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoinTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId.trim()) {
      toast({ title: "Please enter a Trip ID.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const result = await joinTripWithId(tripId);
    if (result.success) {
      toast({ title: "Success!", description: "You have been added to the trip." });
      setTripId('');
      onTripJoined(); // Callback to refresh the trip list
    } else {
      toast({ title: "Failed to Join", description: result.error, variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <Card className="mb-8 shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">Join a Trip</CardTitle>
            <CardDescription>Enter the Trip ID you received in your invitation email.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleJoinTrip} className="flex flex-col sm:flex-row gap-2">
                <Input
                    placeholder="Enter Trip ID"
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    disabled={isLoading}
                    className="flex-grow"
                />
                <Button type="submit" disabled={isLoading} className="sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Join Trip
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}


export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchUserTrips = async () => {
    if (!user) return;
    setDataLoading(true);
    getTripsForUser(user.uid)
      .then(result => {
        if (result.success && result.trips) {
          setTrips(result.trips);
        } else {
          setFetchError(result.error || 'An unknown error occurred while fetching trips.');
        }
      })
      .catch(err => {
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
          setFetchError(errorMessage);
      })
      .finally(() => {
        setDataLoading(false);
      });
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      fetchUserTrips();
    }
  }, [user, authLoading, router]);

  const isLoading = authLoading || dataLoading;

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

      <JoinTripForm onTripJoined={fetchUserTrips} />
      
      {isLoading ? (
        <div className="text-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your trips...</p>
        </div>
      ) : fetchError ? (
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
