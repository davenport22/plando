
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Trip, Activity, Itinerary, ActivityInput } from '@/types';
import { MOCK_DESTINATION_ACTIVITIES } from '@/types'; 
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { CustomActivityForm } from '@/components/activities/CustomActivityForm';
import { ItineraryDisplay } from '@/components/itinerary/ItineraryDisplay';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { suggestItineraryAction, getTrip, updateTrip, getTripActivities, addTripActivity, updateTripActivity } from '@/lib/actions';
import { calculateTripDuration } from '@/lib/utils';
import { ArrowLeft, Loader2, PlusCircle, Wand2, Search, ListChecks, Edit, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from "next/image";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditTripForm } from '@/components/trips/EditTripForm';
import { format, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mapAiOutputToItinerary = (aiOutput: any, tripId: string): Itinerary | null => {
  if (!aiOutput || !aiOutput.itinerary) return null;
  return {
    tripId,
    days: aiOutput.itinerary.map((day: any) => ({
      date: day.date,
      activities: day.activities.map((act: any, index: number) => {
        let imageUrls: string[] = [];
        if (act.imageUrl && typeof act.imageUrl === 'string') {
          imageUrls = [act.imageUrl];
        } else if (Array.isArray(act.imageUrls) && act.imageUrls.every((item: any) => typeof item === 'string')) {
          imageUrls = act.imageUrls;
        } else {
          // Fallback if no image URL is provided by AI for an itinerary activity
          const activityNameForPlaceholder = act.name || 'Activity';
          imageUrls = [`https://placehold.co/400x300.png?text=${encodeURIComponent(activityNameForPlaceholder)}`];
        }
        
        return {
          id: `${act.name ? act.name.replace(/\s+/g, '-') : 'unknown-activity'}-${day.date}-${index}`, 
          name: act.name || 'Unnamed Activity',
          location: act.location || 'Unknown Location',
          duration: act.duration || 1,
          startTime: act.startTime,
          category: act.category,
          description: act.description || '',
          likes: act.likes !== undefined ? act.likes : 0,
          dislikes: act.dislikes !== undefined ? act.dislikes : 0,
          imageUrls: imageUrls,
        };
      }),
    })),
  };
};


export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const tripId = params.tripId as string;

  const [currentView, setCurrentView] = useState<'itinerary' | 'activities'>('itinerary');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [userActivities, setUserActivities] = useState<Activity[]>([]);
  const [generatedItinerary, setGeneratedItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tripDuration, setTripDuration] = useState<string>("");

  const [activitiesAtLastGeneration, setActivitiesAtLastGeneration] = useState<Activity[] | null>(null);
  const [hasActivityChangesSinceLastGen, setHasActivityChangesSinceLastGen] = useState<boolean>(true);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const fetchTripData = async () => {
      setIsLoading(true);
      const fetchedTrip = await getTrip(tripId);
      
      if (fetchedTrip) {
        setTrip(fetchedTrip);
        
        let activities = await getTripActivities(tripId);

        // If no activities are in the DB for this trip, seed them from mock data
        if (activities.length === 0) {
          const destinationActivities = MOCK_DESTINATION_ACTIVITIES[fetchedTrip.destination] || [];
          if (destinationActivities.length > 0) {
              toast({ title: "Finding Activities...", description: `Adding suggested activities for ${fetchedTrip.destination}.`});
              const seedPromises = destinationActivities.map(act => {
                  const { id, ...restOfAct } = act; // Destructure to remove mock ID
                  const activityPayload: Omit<Activity, 'id'> = {
                      ...restOfAct,
                      tripId,
                      isLiked: undefined,
                  };
                  return addTripActivity(tripId, activityPayload);
              });
              const results = await Promise.all(seedPromises);
              // After seeding, refetch activities to get their DB-generated IDs
              activities = await getTripActivities(tripId);
          }
        }
        setUserActivities(activities);

      } else {
        toast({ title: "Trip not found", description: "The trip you are looking for does not exist.", variant: "destructive" });
        router.push('/trips');
      }
      setIsLoading(false);
    };

    fetchTripData();
  }, [tripId, router, toast]);


  useEffect(() => {
    if (trip && trip.startDate && trip.endDate) {
      setTripDuration(calculateTripDuration(trip.startDate, trip.endDate));
    }
  }, [trip]);

  useEffect(() => {
    if (generatedItinerary && activitiesAtLastGeneration) {
      const currentActivityStates = userActivities
        .map(a => ({ id: a.id, isLiked: a.isLiked === undefined ? null : a.isLiked }))
        .sort((a, b) => a.id.localeCompare(b.id));
      
      const prevActivityStates = activitiesAtLastGeneration
        .map(a => ({ id: a.id, isLiked: a.isLiked === undefined ? null : a.isLiked }))
        .sort((a, b) => a.id.localeCompare(b.id));

      if (JSON.stringify(currentActivityStates) !== JSON.stringify(prevActivityStates)) {
        setHasActivityChangesSinceLastGen(true);
      } else {
        setHasActivityChangesSinceLastGen(false);
      }
    } else {
      setHasActivityChangesSinceLastGen(true); 
    }
  }, [userActivities, generatedItinerary, activitiesAtLastGeneration]);


  const handleVote = (activityId: string, liked: boolean) => {
    // Optimistic UI update
    const originalActivities = userActivities;
    setUserActivities(prevActivities =>
      prevActivities.map(act =>
        act.id === activityId ? { ...act, isLiked: liked } : act
      )
    );

    // Update the backend
    updateTripActivity(tripId, activityId, { isLiked: liked }).then(result => {
        if (!result.success) {
            console.error("Failed to save vote:", result.error);
            toast({ title: "Vote Sync Failed", description: "Your vote might not have been saved.", variant: "destructive"});
            // Revert the UI state on failure
            setUserActivities(originalActivities);
        }
    });
  };

  const handleAddCustomActivity = async (newActivityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'participants'>) => {
    const activityPayload: Omit<Activity, 'id'> = {
      ...newActivityData,
      tripId,
      isLiked: true, // Let's auto-like custom activities
      imageUrls: ["https://placehold.co/400x300.png?text=Custom+Activity"], 
      likes: 1, // Assume the creator likes it
      dislikes: 0,
      participants: [],
    };
    
    const result = await addTripActivity(tripId, activityPayload);

    if (result.success && result.activityId) {
      const newActivity: Activity = {
        ...activityPayload,
        id: result.activityId,
      };
      setUserActivities(prevActivities => [newActivity, ...prevActivities]);
      toast({ title: "Custom activity added!", description: `"${newActivity.name}" has been saved and liked.` });
    } else {
      toast({ title: "Error", description: result.error || "Failed to add custom activity.", variant: "destructive" });
    }
  };

  const handleGenerateItinerary = async () => {
    if (!trip) return;

    if (generatedItinerary && !hasActivityChangesSinceLastGen) {
       toast({
          title: "No Itinerary Changes",
          description: "No new votes or activities found since the last itinerary generation. Make some changes to update.",
       });
       setIsLoadingItinerary(false);
       return;
    }

    setIsLoadingItinerary(true);

    const activitiesInput: ActivityInput[] = userActivities
      .filter(act => act.isLiked !== undefined) // Only include voted activities
      .map(act => ({
        name: act.name,
        duration: act.duration,
        location: act.location,
        isLiked: !!act.isLiked, 
      }));
    
    const noActivitiesLiked = activitiesInput.filter(act => act.isLiked).length === 0;
    const hasUnvotedItems = userActivities.some(act => act.isLiked === undefined);

    if (noActivitiesLiked && !generatedItinerary && hasUnvotedItems && userActivities.length > 0) {
       toast({ title: "No Liked Activities", description: "Please like some activities, or vote on all suggested ones, before generating an itinerary.", variant: "default" });
       setIsLoadingItinerary(false);
       return;
    }
    
    if (activitiesInput.length === 0) {
        toast({
            title: "No Voted Activities",
            description: "Add and vote on some activities to generate an itinerary.",
            variant: "destructive"
        });
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
        setActivitiesAtLastGeneration(JSON.parse(JSON.stringify(userActivities))); 
        toast({ title: generatedItinerary && hasActivityChangesSinceLastGen ? "Itinerary Updated!" : "Itinerary Generated!", description: "Your personalized trip itinerary is ready." });
        setCurrentView('itinerary');
      } else {
        toast({ title: "Error Generating Itinerary", description: "Received invalid data from AI.", variant: "destructive" });
      }
    }
    setIsLoadingItinerary(false);
  };

  const handleUpdateTripDetails = async (updatedData: Partial<Omit<Trip, 'id' | 'ownerId' | 'participantIds' | 'imageUrl' | 'participants'>>) => {
    if (!trip) return;

    // The form data already includes formatted date strings
    const result = await updateTrip(trip.id, updatedData as Partial<Trip>);

    if (result.success) {
      setTrip(prevTrip => ({ ...prevTrip!, ...updatedData } as Trip));
      toast({ title: "Trip Updated!", description: `Details for trip "${trip.name}" have been saved.`});
      setIsEditDialogOpen(false);
    } else {
      toast({ title: "Update Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleOpenActivityDetail = (activity: Activity) => {
    setSelectedActivityForDialog(activity);
    setIsActivityDetailDialogOpen(true);
  };


  if (isLoading || !trip) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Loading trip details...</p>
      </div>
    );
  }

  const unvotedActivities = userActivities.filter(act => act.isLiked === undefined);
  const currentActivityToVote = unvotedActivities.length > 0 ? unvotedActivities[0] : null;
  
  const likedActivitiesCount = userActivities.filter(a => a.isLiked).length;
  const noActivitiesLikedForInitialGen = !generatedItinerary && likedActivitiesCount === 0;
  const hasUnvotedActivitiesForInitialGen = userActivities.some(act => act.isLiked === undefined);
  const shouldPromptForInitialVote = noActivitiesLikedForInitialGen && hasUnvotedActivitiesForInitialGen && userActivities.length > 0;

  const disableGenerateButton = isLoadingItinerary ||
    shouldPromptForInitialVote ||
    (!!generatedItinerary && !hasActivityChangesSinceLastGen);

  let buttonHelperText = null;
  if (shouldPromptForInitialVote) {
    buttonHelperText = <p className="text-sm text-muted-foreground text-center mt-2">Please like some activities or finish voting to generate your initial itinerary.</p>;
  } else if (!!generatedItinerary && !hasActivityChangesSinceLastGen) {
    buttonHelperText = <p className="text-sm text-muted-foreground text-center mt-2">No new votes or activities. Make changes to update the itinerary.</p>;
  }


  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.push('/trips')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trips
      </Button>

      <Card className="mb-8 overflow-hidden shadow-xl">
        <div className="relative h-64 w-full md:h-80">
          <Image
            src={trip.imageUrl || "https://placehold.co/1200x400.png"}
            alt={trip.name}
            fill
            style={{ objectFit: 'cover' }} 
            priority
            data-ai-hint="destination panorama"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-white shadow-lg">{trip.name}</h1>
            <p className="text-xl text-primary-foreground/90 mt-2 shadow-sm">{trip.destination}</p>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-md text-primary-foreground/80 shadow-sm">
                  {trip.startDate ? format(parseISO(trip.startDate), "PPP") : 'N/A'} to {trip.endDate ? format(parseISO(trip.endDate), "PPP") : 'N/A'}
                  {tripDuration && <span className="ml-2">({tripDuration})</span>}
                </p>
                <div className="flex items-center -space-x-2">
                  {trip.participants?.map(p => (
                    <Avatar key={p.id} className="h-8 w-8 border-2 border-background" title={p.name}>
                      <AvatarImage src={p.avatarUrl} alt={p.name} />
                      <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {currentView === 'itinerary' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">Smart Itinerary</CardTitle>
              </CardHeader>
              <CardContent>
                <ItineraryDisplay 
                    itinerary={generatedItinerary} 
                    onActivityClick={handleOpenActivityDetail}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Button
                    onClick={handleGenerateItinerary}
                    disabled={disableGenerateButton}
                    className="w-full text-lg py-3"
                    size="lg"
                  >
                    {isLoadingItinerary ? (
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-6 w-6" />
                    )}
                    {generatedItinerary ? 'Update Itinerary' : 'Generate Itinerary'}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full text-lg py-3"
                    size="lg"
                    disabled={likedActivitiesCount === 0}
                  >
                    <Link href={`/trips/${tripId}/liked`}>
                      <ThumbsUp className="mr-2 h-6 w-6" />
                      View Liked ({likedActivitiesCount})
                    </Link>
                  </Button>
                </div>
                {buttonHelperText}
              </CardContent>
            </Card>
          )}

          {currentView === 'activities' && (
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
                      onCardClick={handleOpenActivityDetail}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Wand2 className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                    {userActivities.length > 0 && userActivities.every(act => act.isLiked !== undefined) ? (
                      <>
                        <p className="text-xl mb-2">All activities have been voted on!</p>
                        <p>Ready to generate your itinerary? Switch to the itinerary view.</p>
                      </>
                    ) : (
                       userActivities.length === 0 ? (
                        <>
                          <p className="text-xl mb-2">No activities suggested for this trip yet.</p>
                          <p>Try adding a custom activity!</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xl mb-2">No more activities to vote on right now.</p>
                          <p>Try adding a custom activity or generate your itinerary if you've liked some options!</p>
                        </>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card className="sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary">Trip Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentView === 'itinerary' && (
                <Button onClick={() => setCurrentView('activities')} className="w-full py-3 text-md">
                  <Search className="mr-2 h-5 w-5" />
                  Discover New Activities
                </Button>
              )}
              {currentView === 'activities' && (
                <Button onClick={() => setCurrentView('itinerary')} className="w-full py-3 text-md">
                  <ListChecks className="mr-2 h-5 w-5" />
                  View My Itinerary
                </Button>
              )}
              
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full py-3 text-md">
                    <Edit className="mr-2 h-5 w-5" />
                    Edit Trip Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline text-primary">Edit Trip</DialogTitle>
                    <DialogDescription>
                      Modify details and manage participants for your trip.
                    </DialogDescription>
                  </DialogHeader>
                  {trip && <EditTripForm currentTrip={trip} onSubmit={handleUpdateTripDetails} />}
                </DialogContent>
              </Dialog>


              {currentView === 'activities' && (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ActivityDetailDialog 
        activity={selectedActivityForDialog}
        isOpen={isActivityDetailDialogOpen}
        onOpenChange={setIsActivityDetailDialogOpen}
      />
    </div>
  );
}
