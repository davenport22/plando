
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Trip, Activity, Itinerary, ItineraryDay, ActivityInput } from '@/types';
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { CustomActivityForm } from '@/components/activities/CustomActivityForm';
import { ItineraryDisplay } from '@/components/itinerary/ItineraryDisplay';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { suggestItineraryAction, getTrip, updateTrip, getTripActivities, addTripActivity, voteOnTripActivity, getItinerary, saveItinerary, deleteTrip } from '@/lib/actions';
import { calculateTripDuration } from '@/lib/utils';
import { ArrowLeft, Loader2, PlusCircle, Wand2, Search, ListChecks, Edit, Vote, PlaneTakeoff } from 'lucide-react';
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
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { DndContextProvider } from '@/components/dnd/dnd-context';
import { useAuth } from '@/context/AuthContext';

const mapAiOutputToItinerary = (aiOutput: any, tripId: string): Itinerary | null => {
  if (!aiOutput || !aiOutput.itinerary) return null;
  return {
    tripId,
    days: aiOutput.itinerary.map((day: any) => ({
      date: day.date,
      activities: day.activities.map((act: any, index: number) => ({
          id: `${act.name ? act.name.replace(/\s+/g, '-') : 'unknown-activity'}-${day.date}-${index}`, 
          name: act.name || 'Unnamed Activity',
          location: act.location || 'Unknown Location',
          duration: act.duration || 1,
          startTime: act.startTime,
          category: act.category,
          description: act.description || '',
          likes: act.likes !== undefined ? act.likes : 0,
          dislikes: act.dislikes !== undefined ? act.dislikes : 0,
          imageUrls: [],
          dataAiHint: `${act.name || ''} ${act.location || ''}`.trim(),
      })),
    })),
  };
};

/**
 * Recalculates the start times for all activities in a given day.
 * @param day The day object from the itinerary.
 * @param startHour The hour (0-23) to start the day's activities.
 * @returns The day object with updated activity start times.
 */
const recalculateTimesForDay = (day: ItineraryDay, startHour: number = 9): ItineraryDay => {
  let currentHour = startHour; // Represents hours from midnight, e.g., 9.5 is 9:30 AM

  const updatedActivities = day.activities.map(activity => {
    // Format currentHour to HH:mm
    const hours = Math.floor(currentHour);
    const minutes = Math.round((currentHour - hours) * 60);
    const formattedStartTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const newActivity = { ...activity, startTime: formattedStartTime };

    // Increment currentHour by activity duration for the next activity's start time
    currentHour += activity.duration;

    return newActivity;
  });

  return { ...day, activities: updatedActivities };
};


export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const tripId = params.tripId as string;

  const [currentView, setCurrentView] = useState<'itinerary' | 'activities'>('itinerary');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [userActivities, setUserActivities] = useState<Activity[]>([]);
  const [generatedItinerary, setGeneratedItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tripDuration, setTripDuration] = useState<string>("");

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!tripId || !user) return;

    const fetchTripData = async () => {
      setIsLoading(true);
      const [fetchedTrip, activities, itinerary] = await Promise.all([
          getTrip(tripId),
          getTripActivities(tripId, user.uid),
          getItinerary(tripId)
      ]);
      
      if (fetchedTrip) {
        setTrip(fetchedTrip);
        setGeneratedItinerary(itinerary);
        setUserActivities(activities);
      } else {
        toast({ title: "Trip not found", description: "The trip you are looking for does not exist.", variant: "destructive" });
        router.push('/trips');
      }
      setIsLoading(false);
      setIsInitialLoad(false);
    };

    fetchTripData();
  }, [tripId, router, toast, user]);

  useEffect(() => {
    if (trip && trip.startDate && trip.endDate) {
      setTripDuration(calculateTripDuration(trip.startDate, trip.endDate));
    }
  }, [trip]);

  // This effect will run after the itinerary state has been updated by drag-and-drop
  useEffect(() => {
    // We prevent this from running on the initial data load
    if (!isInitialLoad && generatedItinerary) {
      saveItinerary(tripId, generatedItinerary);
    }
  }, [generatedItinerary, isInitialLoad, tripId]);


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGeneratedItinerary((itinerary) => {
      if (!itinerary) return null;

      const newItinerary = { ...itinerary, days: itinerary.days.map(d => ({ ...d, activities: [...d.activities] })) };

      const oldDayIndex = newItinerary.days.findIndex(day => day.activities.some(act => act.id === active.id));
      const newDayIndex = newItinerary.days.findIndex(day => day.date === over.id || day.activities.some(act => act.id === over.id));

      if (oldDayIndex === -1 || newDayIndex === -1) return itinerary; // Should not happen

      const oldDay = newItinerary.days[oldDayIndex];
      const newDay = newItinerary.days[newDayIndex];

      const activityIndex = oldDay.activities.findIndex(act => act.id === active.id);
      const [movedActivity] = oldDay.activities.splice(activityIndex, 1);

      const overIsDayContainer = newDay.date === over.id;
      if (overIsDayContainer) {
        newDay.activities.push(movedActivity);
      } else {
        const overActivityIndex = newDay.activities.findIndex(act => act.id === over.id);
        newDay.activities.splice(overActivityIndex, 0, movedActivity);
      }

      newItinerary.days[newDayIndex] = recalculateTimesForDay(newItinerary.days[newDayIndex]);
      if (oldDayIndex !== newDayIndex) {
        newItinerary.days[oldDayIndex] = recalculateTimesForDay(newItinerary.days[oldDayIndex]);
      }
      
      return newItinerary;
    });
  };

  const handleVote = async (activityId: string, liked: boolean) => {
    if (!user) {
        toast({ title: "Please log in to vote.", variant: "destructive" });
        return;
    }

    const originalActivities = [...userActivities];
    setUserActivities(prev => prev.filter(act => act.id !== activityId));
    
    const result = await voteOnTripActivity(tripId, activityId, user.uid, liked);

    if (result.success && result.updatedActivity) {
    } else {
        toast({ title: "Vote Sync Failed", description: result.error || "Your vote might not have been saved.", variant: "destructive"});
        setUserActivities(originalActivities); 
    }
};

  const handleAddCustomActivity = async (newActivityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'votes' | 'category' | 'startTime' | 'participants'>) => {
    if (!user) return;
    const result = await addTripActivity(tripId, newActivityData, user.uid);
    if (result.success && result.newActivity) {
      setUserActivities(prevActivities => [result.newActivity!, ...prevActivities]);
      toast({ title: "Custom activity added!", description: `"${newActivityData.name}" has been saved and liked.` });
    } else {
      toast({ title: "Error", description: result.error || "Failed to add custom activity.", variant: "destructive" });
    }
  };

  const handleGenerateItinerary = async () => {
    if (!trip) return;
    setIsLoadingItinerary(true);

    const result = await suggestItineraryAction(trip.id);
    if ('error' in result) {
      toast({ title: "Could Not Generate Itinerary", description: result.error, variant: "destructive" });
    } else {
      const mappedItinerary = mapAiOutputToItinerary(result, trip.id);
      if (mappedItinerary) {
        await saveItinerary(trip.id, mappedItinerary);
        setGeneratedItinerary(mappedItinerary);
        toast({ title: "Itinerary Generated!", description: "Your personalized trip itinerary is ready." });
        setCurrentView('itinerary');
      } else {
        toast({ title: "Error Generating Itinerary", description: "Received invalid data from AI.", variant: "destructive" });
      }
    }
    setIsLoadingItinerary(false);
  };

  const handleUpdateTripDetails = async (updatedData: Partial<Omit<Trip, 'id' | 'ownerId' | 'participantIds' | 'imageUrl' | 'participants'>>) => {
    if (!trip) return;
    const result = await updateTrip(trip.id, updatedData as Partial<Trip>);
    if (result.success) {
      setTrip(prevTrip => ({ ...prevTrip!, ...updatedData } as Trip));
      toast({ title: "Trip Updated!", description: `Details for trip "${trip.name}" have been saved.`});
      setIsEditDialogOpen(false);
    } else {
      toast({ title: "Update Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteTrip = async (tripToDeleteId: string) => {
    if (!trip) return;
    const result = await deleteTrip(tripToDeleteId);
    if (result.success) {
      toast({ title: "Trip Deleted!", description: `Your trip "${trip.name}" has been deleted.`});
      router.push('/trips');
    } else {
       toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    }
  }

  const handleOpenActivityDetail = (activity: Activity) => {
    setSelectedActivityForDialog(activity);
    setIsActivityDetailDialogOpen(true);
  };

  if (isLoading || !trip || authLoading) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Loading trip details...</p>
      </div>
    );
  }

  const unvotedActivities = userActivities.filter(act => act.isLiked === undefined);
  const currentActivityToVote = unvotedActivities.length > 0 ? unvotedActivities[0] : null;
  const votedActivitiesCount = userActivities.filter(act => act.isLiked !== undefined).length;
  
  return (
    <DndContextProvider onDragEnd={handleDragEnd}>
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => router.push('/trips')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trips
      </Button>

      <Card className="mb-8 overflow-hidden shadow-xl">
        <div className="relative h-64 w-full md:h-80 bg-muted">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
            {trip.imageUrl && (
              <Image
                  src={trip.imageUrl}
                  alt={trip.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                  data-ai-hint="travel background"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
                <PlaneTakeoff className="h-32 w-32 text-white/20" />
            </div>
            <div className="relative z-20 flex flex-col justify-end h-full p-8">
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
                <ItineraryDisplay itinerary={generatedItinerary} onActivityClick={handleOpenActivityDetail} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Button onClick={handleGenerateItinerary} disabled={isLoadingItinerary} className="w-full text-lg py-3" size="lg">
                    {isLoadingItinerary ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Wand2 className="mr-2 h-6 w-6" />}
                    {generatedItinerary ? 'Update Itinerary' : 'Generate Itinerary'}
                  </Button>
                  <Button asChild variant="outline" className="w-full text-lg py-3" size="lg">
                    <Link href={`/trips/${tripId}/liked`}>
                      <Vote className="mr-2 h-6 w-6" />
                      View Group Votes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentView === 'activities' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">{currentActivityToVote ? `Vote: ${currentActivityToVote.name}` : "Activity Voting"}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[450px] py-8">
                {currentActivityToVote ? (
                  <div className="w-full max-w-xs sm:max-w-sm">
                    <ActivityVotingCard key={currentActivityToVote.id} activity={currentActivityToVote} onVote={handleVote} onCardClick={handleOpenActivityDetail} />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Wand2 className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                    <p className="text-xl mb-2">{userActivities.length > 0 ? "All activities voted on!" : "No activities found for this trip."}</p>
                    <p>{userActivities.length > 0 ? "Ready to generate your itinerary?" : "Try adding a custom activity to get started!"}</p>
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
              <Button onClick={() => setCurrentView(currentView === 'itinerary' ? 'activities' : 'itinerary')} className="w-full py-3 text-md">
                {currentView === 'itinerary' ? <><Search className="mr-2 h-5 w-5" />Discover New Activities</> : <><ListChecks className="mr-2 h-5 w-5" />View My Itinerary</>}
              </Button>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" className="w-full py-3 text-md"><Edit className="mr-2 h-5 w-5" />Edit Trip Details</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline text-primary">Edit Trip</DialogTitle>
                    <DialogDescription>Modify details and manage participants for your trip.</DialogDescription>
                  </DialogHeader>
                  {trip && <EditTripForm currentTrip={trip} onSubmit={handleUpdateTripDetails} onDelete={handleDeleteTrip} />}
                </DialogContent>
              </Dialog>
              
                <Dialog>
                  <DialogTrigger asChild><Button variant="outline" className="w-full py-3 text-md"><PlusCircle className="mr-2 h-5 w-5" />Add Custom Activity</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-headline text-primary">Add Custom Activity</DialogTitle>
                      <DialogDescription>Fill in the details for your own activity to add to the voting queue.</DialogDescription>
                    </DialogHeader>
                    <CustomActivityForm onAddActivity={handleAddCustomActivity} />
                  </DialogContent>
                </Dialog>
              
            </CardContent>
          </Card>
        </div>
      </div>
      <ActivityDetailDialog activity={selectedActivityForDialog} isOpen={isActivityDetailDialogOpen} onOpenChange={setIsActivityDetailDialogOpen} />
    </div>
    </DndContextProvider>
  );
}
