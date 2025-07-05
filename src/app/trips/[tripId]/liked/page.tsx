
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Trip, Activity } from '@/types';
import { getTrip, getTripActivities } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, ThumbsUp, MapPin, Clock, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// A new component for displaying a single liked activity card
function LikedActivityCard({ activity, onCardClick }: { activity: Activity; onCardClick: (activity: Activity) => void }) {
  const imageHint = activity.dataAiHint || activity.name.toLowerCase().split(" ").slice(0,2).join(" ") || "activity";
  const displayImageUrl = activity.imageUrls && activity.imageUrls.length > 0 
    ? activity.imageUrls[0] 
    : "https://placehold.co/400x250.png";

  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg flex flex-col h-full cursor-pointer group"
      onClick={() => onCardClick(activity)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(activity)}}
      role="button"
      tabIndex={0}
      aria-label={`View details for liked activity: ${activity.name}`}
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
      <CardFooter className="p-3 border-t bg-muted/30 text-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <Info className="inline h-3 w-3 mr-1" /> Click to see details
      </CardFooter>
    </Card>
  );
}


export default function LikedActivitiesPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [likedActivities, setLikedActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const fetchPageData = async () => {
      setIsLoading(true);
      const fetchedTrip = await getTrip(tripId);

      if (fetchedTrip) {
        setTrip(fetchedTrip);
        const allActivities = await getTripActivities(tripId);
        const liked = allActivities.filter(act => act.isLiked === true);
        setLikedActivities(liked);
      } else {
        // Trip not found, redirect
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

  if (isLoading || !trip) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-lg text-muted-foreground">Loading liked activities...</p>
      </div>
    );
  }

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
            Liked Activities
           </h1>
           <p className="text-muted-foreground">For your trip to {trip.destination}</p>
        </div>
        <div className="flex-1" />
      </div>

      {likedActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {likedActivities.map((activity) => (
            <LikedActivityCard key={activity.id} activity={activity} onCardClick={handleOpenActivityDetail} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-10 shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-3">
                <ThumbsUp className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">No Liked Activities Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Go back to the trip page and vote on some activities to see them here.
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
    </div>
  );
}
