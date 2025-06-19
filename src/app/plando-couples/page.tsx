
"use client";

import { useState, useEffect } from 'react';
import type { Activity } from '@/types';
import { MOCK_COUPLES_ACTIVITIES_BY_CITY, MOCK_USER_PROFILE } from '@/types'; 
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, RotateCcw, MapPin, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { plandoModules } from "@/config/plandoModules";
import Link from 'next/link';

const LOCAL_STORAGE_LIKED_ACTIVITIES_KEY = `plandoCouplesLikedActivities_${MOCK_USER_PROFILE.id}`;

export default function PlandoCouplesPage() {
  const { toast } = useToast();
  const couplesModule = plandoModules.find(m => m.id === 'couples');
  const Icon = couplesModule?.Icon || Heart;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndOfList, setShowEndOfList] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [currentLocationKey, setCurrentLocationKey] = useState<string>("Default");

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);
  
  const [likedActivitiesCount, setLikedActivitiesCount] = useState(0);

  useEffect(() => {
    // Load liked activities from localStorage to set initial count
    const storedLikedActivities = localStorage.getItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
    if (storedLikedActivities) {
      try {
        const parsedActivities: Activity[] = JSON.parse(storedLikedActivities);
        setLikedActivitiesCount(parsedActivities.length);
      } catch (e) {
        console.error("Error parsing liked activities from localStorage", e);
        setLikedActivitiesCount(0);
      }
    }
    fetchActivitiesBasedOnLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivitiesBasedOnLocation = async () => {
    setIsLoading(true);
    setLocationStatusMessage("Fetching location and activities for couples...");

    let determinedLocationKey = "Default";
    let statusMsg = "";

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
        statusMsg = `Using profile location for couples activities: ${determinedLocationKey}. (Live location: ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`;
      } catch (error: any) {
        determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
        statusMsg = `Could not get live location for couples activities. Using profile location: ${determinedLocationKey}.`;
        if (error.code === error.PERMISSION_DENIED) {
          statusMsg = `Location access denied for couples activities. Using profile location: ${determinedLocationKey}.`;
        }
      }
    } else {
      determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
      statusMsg = `Geolocation not supported. Using profile location for couples activities: ${determinedLocationKey}.`;
    }
    
    setCurrentLocationKey(determinedLocationKey);
    setLocationStatusMessage(statusMsg);

    const activitiesToShow = (MOCK_COUPLES_ACTIVITIES_BY_CITY[determinedLocationKey] || MOCK_COUPLES_ACTIVITIES_BY_CITY["Default"])
                              .map(act => ({ ...act, isLiked: undefined }));
    
    setActivities(activitiesToShow);
    setCurrentActivityIndex(0);
    setShowEndOfList(activitiesToShow.length === 0);
    setIsLoading(false);
    if (activitiesToShow.length === 0) {
        toast({ title: "No Activities Found", description: `No local couples activities found in ${determinedLocationKey}.`, variant: "default"});
    }
  };


  const handleVote = (activityId: string, liked: boolean) => {
    const votedActivity = activities.find(act => act.id === activityId);
    if (!votedActivity) return;

    setActivities(prevActivities =>
      prevActivities.map(act =>
        act.id === activityId ? { ...act, isLiked: liked } : act
      )
    );
    
    toast({
      title: liked ? "Date Idea Liked!" : "Date Idea Skipped",
      description: `You ${liked ? 'liked' : 'skipped'} "${votedActivity.name}".`,
    });

    if (liked) {
      try {
        const storedLikedActivities = localStorage.getItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
        let currentLiked: Activity[] = [];
        if (storedLikedActivities) {
          currentLiked = JSON.parse(storedLikedActivities);
        }
        // Add if not already present
        if (!currentLiked.find(act => act.id === votedActivity.id)) {
          const updatedLiked = [...currentLiked, votedActivity];
          localStorage.setItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY, JSON.stringify(updatedLiked));
          setLikedActivitiesCount(updatedLiked.length);
        }
      } catch (e) {
        console.error("Error saving liked activity to localStorage", e);
        toast({ title: "Error", description: "Could not save liked activity preference.", variant: "destructive"});
      }
    }

    if (currentActivityIndex < activities.length - 1) {
      setCurrentActivityIndex(prevIndex => prevIndex + 1);
    } else {
      setShowEndOfList(true);
    }
  };

  const handleOpenActivityDetail = (activity: Activity) => {
    setSelectedActivityForDialog(activity);
    setIsActivityDetailDialogOpen(true);
  };

  const handleResetDeck = () => {
    toast({ title: "Resetting Date Ideas Deck...", description: `Reloading couples activities for ${currentLocationKey}.`});
    fetchActivitiesBasedOnLocation();
  };
  
  const currentActivity = !isLoading && !showEndOfList && activities.length > 0 
    ? activities[currentActivityIndex] 
    : null;

  if (isLoading && activities.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{locationStatusMessage || "Loading local date ideas..."}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-xl relative overflow-visible">
        <CardHeader className="pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">{couplesModule?.name || "Plando Couples"}</CardTitle>
          <p className="text-md text-muted-foreground">Discover and swipe on romantic activities and date ideas!</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[480px] p-4 sm:p-6">
           {locationStatusMessage && (
            <div className="mb-3 text-xs text-muted-foreground p-2 border border-dashed rounded-md flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70"/> 
                <span>{locationStatusMessage}</span>
            </div>
          )}
          {isLoading && activities.length > 0 && ( 
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Reloading date ideas...</p>
            </div>
          )}
          {!isLoading && currentActivity ? (
            <div className="w-full max-w-xs sm:max-w-sm">
              <ActivityVotingCard
                key={currentActivity.id}
                activity={currentActivity}
                onVote={handleVote}
                onCardClick={handleOpenActivityDetail}
              />
            </div>
          ) : !isLoading && (
            <div className="text-center text-muted-foreground space-y-4">
              <Heart className="h-20 w-20 mx-auto text-primary/40" />
              <p className="text-xl">
                {activities.length === 0 
                  ? `No local date ideas found for ${currentLocationKey === "Default" ? "your area" : currentLocationKey}.` 
                  : "You've swiped through all local date ideas!"}
              </p>
              <p className="text-sm">Check back later or reset the deck for more romantic suggestions.</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={handleResetDeck} variant="outline" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                  Reset Deck
                </Button>
                <Link href="/plando-couples/matches" passHref>
                  <Button variant="default" disabled={likedActivitiesCount === 0}>
                    <ListChecks className="mr-2 h-4 w-4" />
                    View Liked Ideas ({likedActivitiesCount})
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!isLoading && !currentActivity && activities.length > 0 && ( // Show if voting is done
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/plando-couples/matches" passHref>
              <Button variant="default" size="lg" disabled={likedActivitiesCount === 0}>
                <ListChecks className="mr-2 h-5 w-5" />
                View Your Liked Date Ideas ({likedActivitiesCount})
              </Button>
            </Link>
        </div>
      )}
      
      {currentActivity && (
         <div className="mt-6">
            <Link href="/plando-couples/matches" passHref>
              <Button variant="secondary" disabled={likedActivitiesCount === 0}>
                <ListChecks className="mr-2 h-4 w-4" />
                View Liked Date Ideas ({likedActivitiesCount})
              </Button>
            </Link>
        </div>
      )}


      <ActivityDetailDialog 
        activity={selectedActivityForDialog}
        isOpen={isActivityDetailDialogOpen}
        onOpenChange={setIsActivityDetailDialogOpen}
      />
    </div>
  );
}
