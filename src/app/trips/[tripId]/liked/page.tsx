
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Trip, Activity, ItineraryDay, Itinerary } from '@/types';
import { getTrip, getTripActivities, getItinerary, addActivityToItineraryDay, updateTripActivity } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, ThumbsUp, ThumbsDown, MapPin, Clock, Info, Vote, PlusCircle, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, parseISO } from 'date-fns';

function VotedActivityCard({ 
  activity, 
  onCardClick, 
  onAddToPlanClick 
}: { 
  activity: Activity; 
  onCardClick: (activity: Activity) => void;
  onAddToPlanClick?: (activity: Activity) => void;
}) {
  const imageHint = activity.dataAiHint || activity.name.toLowerCase().split(" ").slice(0,2).join(" ") || "activity";
  const displayImageUrl = activity.imageUrls && activity.imageUrls.length > 0 
    ? activity.imageUrls[0] 
    : "https://placehold.co/400x250.png";

  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg flex flex-col h-full group"
    >
      <div 
        className="relative cursor-pointer" 
        onClick={() => onCardClick(activity)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(activity)}}
        role="button"
        tabIndex={0}
        aria-label={`View details for voted activity: ${activity.name}`}
      >
        <CardHeader className="p-0 relative">
          <Image
            src={displayImageUrl}
            alt={activity.name}
            width={400}
            height={200}
            className="object-cover w-full h-40"
            data-ai-hint={imageHint}
          />
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 shadow-md backdrop-blur-sm">
            {activity.isLiked === true && <ThumbsUp className="h-5 w-5 text-green-500" title="Liked" />}
            {activity.isLiked === false && <ThumbsDown className="h-5 w-5 text-red-500" title="Disliked" />}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-headline mb-1 group-hover:text-primary transition-colors">{activity.name}</CardTitle>
          {activity.description && <CardDescription className="text-xs mb-2 text-muted-foreground line-clamp-2">{activity.description.split('.')[0] + '.'}</CardDescription>}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="mr-2 h-3 w-3 text-accent" />
              <span>{activity.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-3 w-3 text-accent" />
              <span>{activity.duration} hours</span>
            </div>
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-3 border-t bg-muted/30">
        {onAddToPlanClick ? (
            <Button variant="secondary" size="sm" className="w-full" onClick={() => onAddToPlanClick(activity)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add to Plan
            </Button>
        ) : (
            <div className="text-center text-xs text-primary font-medium w-full">
                <Info className="inline h-3 w-3 mr-1" /> Part of your plan
            </div>
        )}
      </CardFooter>
    </Card>
  );
}


export default function VotedActivitiesPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  const { toast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [likedActivities, setLikedActivities] = useState<Activity[]>([]);
  const [dislikedActivities, setDislikedActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activityToAdd, setActivityToAdd] = useState<Activity | null>(null);

  useEffect(() => {
    if (!tripId) return;

    const fetchPageData = async () => {
      setIsLoading(true);
      const [fetchedTrip, allActivities, fetchedItinerary] = await Promise.all([
        getTrip(tripId),
        getTripActivities(tripId),
        getItinerary(tripId)
      ]);

      if (fetchedTrip) {
        setTrip(fetchedTrip);
        setItinerary(fetchedItinerary);
        const liked = allActivities.filter(act => act.isLiked === true);
        const disliked = allActivities.filter(act => act.isLiked === false);
        setLikedActivities(liked);
        setDislikedActivities(disliked);
      } else {
        router.push('/trips');
      }
      setIsLoading(false);
    };

    fetchPageData();
  }, [tripId, router]);

  const handleOpenActivityDetail = (activity: Activity) => {
    setSelectedActivityForDialog(activity);
    setIsActivityDetailDialogOpen(true);
  };
  
  const handleOpenAddToPlan = (activity: Activity) => {
    setActivityToAdd(activity);
    setIsAddDialogOpen(true);
  };

  const handleAddActivityToDay = async (activity: Activity, date: string) => {
    setIsAddDialogOpen(false);
    
    // Optimistic UI update
    setDislikedActivities(prev => prev.filter(a => a.id !== activity.id));
    setLikedActivities(prev => [{ ...activity, isLiked: true }, ...prev]);

    const result = await addActivityToItineraryDay(tripId, activity, date);
    
    if (result.success) {
      toast({
        title: "Activity Added!",
        description: `"${activity.name}" has been added to your itinerary for ${format(parseISO(date), "MMM d")}.`
      });
      // Optionally re-validate path to ensure server state is fresh on next load
      // revalidatePath(`/trips/${tripId}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Could not add activity to the plan.",
        variant: "destructive"
      });
      // Revert optimistic update
      setLikedActivities(prev => prev.filter(a => a.id !== activity.id));
      setDislikedActivities(prev => [activity, ...prev]);
    }
  };

  if (isLoading || !trip) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Loading voted activities...</p>
      </div>
    );
  }

  const hasVotes = likedActivities.length > 0 || dislikedActivities.length > 0;
  const itineraryDays = itinerary?.days.map(d => d.date) ?? [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <Link href={`/trips/${tripId}`} passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Itinerary
            </Button>
          </Link>
        </div>
        <div className="flex-1 text-center">
           <h1 className="text-3xl font-headline text-primary">
            Activity Votes
           </h1>
           <p className="text-muted-foreground">For your trip to {trip.destination}</p>
        </div>
        <div className="flex-1" />
      </div>

      {hasVotes ? (
        <div className="space-y-12">
            {likedActivities.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <ThumbsUp className="h-7 w-7 text-green-500" />
                        <h2 className="text-2xl font-headline text-foreground">Liked Activities ({likedActivities.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {likedActivities.map((activity) => (
                            <VotedActivityCard key={activity.id} activity={activity} onCardClick={handleOpenActivityDetail} />
                        ))}
                    </div>
                </section>
            )}

            {dislikedActivities.length > 0 && (
                 <section>
                    <div className="flex items-center gap-3 mb-4">
                        <ThumbsDown className="h-7 w-7 text-red-500" />
                        <h2 className="text-2xl font-headline text-foreground">Disliked Activities ({dislikedActivities.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {dislikedActivities.map((activity) => (
                            <VotedActivityCard 
                                key={activity.id} 
                                activity={activity} 
                                onCardClick={handleOpenActivityDetail}
                                onAddToPlanClick={handleOpenAddToPlan}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
      ) : (
        <Card className="text-center py-10 shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-3">
                <Vote className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">No Activities Voted On Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Go back to the trip page and vote on some activities to see your group's preferences here.
            </p>
            <Link href={`/trips/${tripId}`} passHref>
              <Button className="mt-6" size="lg">
                Vote on Activities
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <ActivityDetailDialog 
        activity={selectedActivityForDialog}
        isOpen={isActivityDetailDialogOpen}
        onOpenChange={setIsActivityDetailDialogOpen}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add "{activityToAdd?.name}" to your plan?</DialogTitle>
            <DialogDescription>
              Select which day you'd like to add this activity to. This will also move it to your "Liked" list.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {itineraryDays.length > 0 ? (
                itineraryDays.map((day, index) => (
                    <Button
                        key={day}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => activityToAdd && handleAddActivityToDay(activityToAdd, day)}
                    >
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Day {index + 1}: {format(parseISO(day), "EEEE, MMM d")}
                    </Button>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center">
                    Generate an itinerary first to choose a day.
                </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
