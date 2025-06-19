
"use client";

import { useState, useEffect } from 'react';
import type { Activity } from '@/types';
import { MOCK_ACTIVITIES_BY_CITY, MOCK_USER_PROFILE } from '@/types'; 
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, RotateCcw, MapPin } from 'lucide-react'; // Use Users icon
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { plandoModules } from "@/config/plandoModules";

export default function PlandoFriendsPage() {
  const { toast } = useToast();
  const friendsModule = plandoModules.find(m => m.id === 'friends');
  const Icon = friendsModule?.Icon || Users; // Default to Users icon

  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndOfList, setShowEndOfList] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [currentLocationKey, setCurrentLocationKey] = useState<string>("Default");

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  const fetchActivitiesBasedOnLocation = async () => {
    setIsLoading(true);
    setLocationStatusMessage("Fetching location and activities for friends...");

    let determinedLocationKey = "Default";
    let statusMsg = "";

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
        statusMsg = `Using profile location for friend activities: ${determinedLocationKey}. (Live location: ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`;
      } catch (error: any) {
        determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
        statusMsg = `Could not get live location for friend activities. Using profile location: ${determinedLocationKey}.`;
        if (error.code === error.PERMISSION_DENIED) {
          statusMsg = `Location access denied for friend activities. Using profile location: ${determinedLocationKey}.`;
        }
      }
    } else {
      determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
      statusMsg = `Geolocation not supported. Using profile location for friend activities: ${determinedLocationKey}.`;
    }
    
    setCurrentLocationKey(determinedLocationKey);
    setLocationStatusMessage(statusMsg);

    const activitiesToShow = (MOCK_ACTIVITIES_BY_CITY[determinedLocationKey] || MOCK_ACTIVITIES_BY_CITY["Default"])
                              .map(act => ({ ...act, isLiked: undefined }));
    
    setActivities(activitiesToShow);
    setCurrentActivityIndex(0);
    setShowEndOfList(activitiesToShow.length === 0);
    setIsLoading(false);
    if (activitiesToShow.length === 0) {
        toast({ title: "No Activities Found", description: `No local activities found for friends in ${determinedLocationKey}.`, variant: "default"});
    }
  };

  useEffect(() => {
    fetchActivitiesBasedOnLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleVote = (activityId: string, liked: boolean) => {
    setActivities(prevActivities =>
      prevActivities.map(act =>
        act.id === activityId ? { ...act, isLiked: liked } : act
      )
    );
    
    const votedActivity = activities.find(act => act.id === activityId);
    if (votedActivity) {
        toast({
        title: liked ? "Friend Activity Liked!" : "Friend Activity Skipped",
        description: `You ${liked ? 'liked' : 'skipped'} "${votedActivity.name}".`,
        });
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
    toast({ title: "Resetting Friend Activity Deck...", description: `Reloading activities for ${currentLocationKey}.`});
    fetchActivitiesBasedOnLocation();
  };
  
  const currentActivity = !isLoading && !showEndOfList && activities.length > 0 
    ? activities[currentActivityIndex] 
    : null;

  if (isLoading && activities.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{locationStatusMessage || "Loading local activities for friends..."}</p>
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
          <CardTitle className="text-3xl font-headline text-primary">{friendsModule?.name || "Plando Friends"}</CardTitle>
          <p className="text-md text-muted-foreground">Discover and swipe on activities to do with friends!</p>
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
                <p className="mt-3 text-sm text-muted-foreground">Reloading friend activities...</p>
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
              <Users className="h-20 w-20 mx-auto text-primary/40" />
              <p className="text-xl">
                {activities.length === 0 
                  ? `No local friend activities found for ${currentLocationKey === "Default" ? "your area" : currentLocationKey}.` 
                  : "You've swiped through all local friend activities!"}
              </p>
              <p className="text-sm">Check back later or reset the deck.</p>
              <Button onClick={handleResetDeck} variant="outline" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset Friend Activities
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityDetailDialog 
        activity={selectedActivityForDialog}
        isOpen={isActivityDetailDialogOpen}
        onOpenChange={setIsActivityDetailDialogOpen}
      />
    </div>
  );
}

    