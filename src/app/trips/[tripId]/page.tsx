"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Corrected import
import type { Trip, Activity, Itinerary, ActivityInput } from '@/types';
import { MOCK_TRIPS, MOCK_SUGGESTED_ACTIVITIES_PARIS, MOCK_USER } from '@/types';
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { CustomActivityForm } from '@/components/activities/CustomActivityForm';
import { ItineraryDisplay } from '@/components/itinerary/ItineraryDisplay';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { suggestItineraryAction } from '@/lib/actions';
import { ArrowLeft, Loader2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from "next/image";

// Helper to map AI output to our Itinerary type
const mapAiOutputToItinerary = (aiOutput: any, tripId: string): Itinerary | null => {
  if (!aiOutput || !aiOutput.itinerary) return null;
  return {
    tripId,
    days: aiOutput.itinerary.map((day: any) => ({
      date: day.date,
      activities: day.activities.map((act: any, index: number) => ({
        id: `${act.name.replace(/\s+/g, '-')}-${index}`, // Generate a simple ID
        name: act.name,
        location: act.location,
        duration: act.duration,
        startTime: act.startTime,
        category: act.category,
        description: act.description || '', // AI might not provide this
      })),
    })),
  };
};


export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [userActivities, setUserActivities] = useState<Activity[]>([]); // Suggested + custom activities
  const [generatedItinerary, setGeneratedItinerary] = useState<Itinerary | null>(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);

  useEffect(() => {
    // Fetch trip details and suggested activities
    // For now, using mock data
    const currentTrip = MOCK_TRIPS.find(t => t.id === tripId);
    if (currentTrip) {
      setTrip(currentTrip);
      // Simulate fetching activities for this trip type, here hardcoding Paris
      const initialActivities = MOCK_SUGGESTED_ACTIVITIES_PARIS.map(act => ({ ...act, tripId, isLiked: undefined }));
      setUserActivities(initialActivities);
    } else {
      toast({ title: "Trip not found", variant: "destructive" });
      router.push('/');
    }
  }, [tripId, router, toast]);

  const handleVote = (activityId: string, liked: boolean) => {
    setUserActivities(prevActivities =>
      prevActivities.map(act =>
        act.id === activityId ? { ...act, isLiked: liked } : act
      )
    );
  };

  const handleAddCustomActivity = (newActivityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrl'>) => {
    const newActivity: Activity = {
      ...newActivityData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      tripId,
      isLiked: true, // Custom activities are implicitly liked by the adder
      imageUrl: "https://placehold.co/300x200.png?text=Custom", // Placeholder for custom
    };
    setUserActivities(prevActivities => [...prevActivities, newActivity]);
    toast({ title: "Custom activity added!", description: `"${newActivity.name}" has been added to your list.` });
  };

  const handleGenerateItinerary = async () => {
    if (!trip) return;
    setIsLoadingItinerary(true);

    const activitiesInput: ActivityInput[] = userActivities.map(act => ({
      name: act.name,
      duration: act.duration,
      location: act.location,
      isLiked: !!act.isLiked, // Ensure boolean
    }));
    
    const result = await suggestItineraryAction(trip.id, activitiesInput, trip.startDate, trip.endDate);

    if ('error' in result) {
      toast({ title: "Error Generating Itinerary", description: result.error, variant: "destructive" });
    } else {
      const mappedItinerary = mapAiOutputToItinerary(result, trip.id);
      if (mappedItinerary) {
        setGeneratedItinerary(mappedItinerary);
        toast({ title: "Itinerary Generated!", description: "Your personalized trip itinerary is ready." });
      } else {
        toast({ title: "Error Generating Itinerary", description: "Received invalid data from AI.", variant: "destructive" });
      }
    }
    setIsLoadingItinerary(false);
  };

  if (!trip) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Loading trip details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trips
      </Button>

      <Card className="mb-8 overflow-hidden shadow-xl">
        <div className="relative h-64 w-full md:h-80">
            <Image
              src={trip.imageUrl || "https://placehold.co/1200x400.png"}
              alt={trip.name}
              layout="fill"
              objectFit="cover"
              priority
              data-ai-hint="destination panorama"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-8">
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-white shadow-lg">{trip.name}</h1>
                <p className="text-xl text-primary-foreground/90 mt-2 shadow-sm">{trip.destination}</p>
                <p className="text-md text-primary-foreground/80 mt-1 shadow-sm">{trip.startDate} to {trip.endDate}</p>
            </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary">Vote on Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {userActivities.filter(act => !act.id.startsWith('custom-')).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userActivities.filter(act => !act.id.startsWith('custom-')).map(activity => (
                    <ActivityVotingCard key={activity.id} activity={activity} onVote={handleVote} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No suggested activities for this destination yet.</p>
              )}
            </CardContent>
          </Card>
          
          {userActivities.filter(act => act.id.startsWith('custom-')).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">Your Custom Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userActivities.filter(act => act.id.startsWith('custom-')).map(activity => (
                      <ActivityVotingCard key={activity.id} activity={activity} onVote={handleVote} />
                    ))}
                  </div>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-1 space-y-8">
          <CustomActivityForm onAddActivity={handleAddCustomActivity} />
          
          <Card className="sticky top-24 shadow-lg"> {/* Sticky for easy access */}
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary">Trip Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerateItinerary}
                disabled={isLoadingItinerary || userActivities.length === 0}
                className="w-full mb-4 text-lg py-6"
                size="lg"
              >
                {isLoadingItinerary ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-6 w-6" />
                )}
                Generate Itinerary
              </Button>
              <Separator className="my-4" />
              <ItineraryDisplay itinerary={generatedItinerary} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
