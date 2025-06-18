
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import type { Trip, Activity, Itinerary, ActivityInput } from '@/types';
import { MOCK_TRIPS, MOCK_SUGGESTED_ACTIVITIES_PARIS } from '@/types';
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { CustomActivityForm } from '@/components/activities/CustomActivityForm';
import { ItineraryDisplay } from '@/components/itinerary/ItineraryDisplay';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { suggestItineraryAction } from '@/lib/actions';
import { ArrowLeft, Loader2, PlusCircle, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
        description: act.description || '', 
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
  const [userActivities, setUserActivities] = useState<Activity[]>([]); 
  const [generatedItinerary, setGeneratedItinerary] = useState<Itinerary | null>(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);

  useEffect(() => {
    const currentTrip = MOCK_TRIPS.find(t => t.id === tripId);
    if (currentTrip) {
      setTrip(currentTrip);
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
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      isLiked: undefined, 
      imageUrl: "https://placehold.co/300x200.png?text=Custom", 
    };
    setUserActivities(prevActivities => [newActivity, ...prevActivities]); 
    toast({ title: "Custom activity added!", description: `"${newActivity.name}" is ready for voting.` });
  };

  const handleGenerateItinerary = async () => {
    if (!trip) return;
    setIsLoadingItinerary(true);

    const activitiesInput: ActivityInput[] = userActivities
      .filter(act => act.isLiked !== undefined) 
      .map(act => ({
        name: act.name,
        duration: act.duration,
        location: act.location,
        isLiked: !!act.isLiked, 
      }));
    
    if (activitiesInput.filter(act => act.isLiked).length === 0) {
      toast({ title: "No Liked Activities", description: "Please like some activities before generating an itinerary.", variant: "default" });
      setIsLoadingItinerary(false);
      return;
    }
    
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

  const unvotedActivities = userActivities.filter(act => act.isLiked === undefined);
  const currentActivityToVote = unvotedActivities.length > 0 ? unvotedActivities[0] : null;

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
              fill
              className="object-cover"
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
              <CardTitle className="text-2xl font-headline text-primary">
                {currentActivityToVote ? `Vote: ${currentActivityToVote.name}` : "Activity Voting"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[450px] py-8">
              {currentActivityToVote ? (
                <div className="w-full max-w-xs sm:max-w-sm"> 
                  <ActivityVotingCard
                    key={currentActivityToVote.id}
                    activity={currentActivityToVote}
                    onVote={handleVote}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Wand2 className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                  {userActivities.length > 0 && userActivities.every(act => act.isLiked !== undefined) ? (
                    <>
                      <p className="text-xl mb-2">All activities have been voted on!</p>
                      <p>Ready to generate your itinerary?</p>
                    </>
                  ) : (
                     <>
                      <p className="text-xl mb-2">No more activities to vote on right now.</p>
                      <p>Try adding a custom activity or generate your itinerary if you've liked some options!</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full py-3 text-md">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Custom Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline text-primary">Add Custom Activity</DialogTitle>
                <DialogDescription>
                  Fill in the details for your own activity to add to the voting queue.
                </DialogDescription>
              </DialogHeader>
              <CustomActivityForm onAddActivity={handleAddCustomActivity} />
            </DialogContent>
          </Dialog>
          
          <Card className="sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary">Trip Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerateItinerary}
                disabled={isLoadingItinerary || userActivities.filter(act => act.isLiked === true).length === 0}
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
