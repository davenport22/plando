
"use client";

import { useState, useEffect } from 'react';
import type { Activity } from '@/types';
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Users, RotateCcw, MapPin, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { plandoModules } from "@/config/plandoModules";
import { useLocalActivities } from '@/hooks/useLocalActivities';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CustomActivityForm } from '@/components/activities/CustomActivityForm';
import { addCustomMeetActivity } from '@/lib/actions';

export default function PlandoMeetPage() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const meetModule = plandoModules.find(m => m.id === 'meet');
  const Icon = meetModule?.Icon || Sparkles;

  const { 
    activities, 
    setActivities, 
    isLoading, 
    locationStatusMessage, 
    currentLocationKey, 
    fetchActivities: fetchNewActivities 
  } = useLocalActivities('meet', userProfile);

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showEndOfList, setShowEndOfList] = useState(false);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  const [isCustomActivityOpen, setIsCustomActivityOpen] = useState(false);

  useEffect(() => {
    setCurrentActivityIndex(0);
    setShowEndOfList(activities.length > 0 ? false : true);
  }, [activities]);

  const handleVote = (activityId: string, liked: boolean) => {
    setActivities(prevActivities =>
      prevActivities.map(act =>
        act.id === activityId ? { ...act, isLiked: liked } : act
      )
    );
    
    const votedActivity = activities.find(act => act.id === activityId);
    if (votedActivity) {
        toast({
        title: liked ? "Activity Liked!" : "Activity Skipped",
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
    toast({ title: "Resetting Activity Deck...", description: `Reloading activities for ${currentLocationKey}.`});
    fetchNewActivities();
  };

  const handleAddCustomActivity = async (data: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'participants' | 'category' | 'startTime'>) => {
      if (!userProfile) return;
      const result = await addCustomMeetActivity(userProfile.id, data);
      if (result.success && result.activity) {
          toast({
              title: "Custom Activity Added!",
              description: `"${result.activity.name}" has been added to your swiping deck.`,
          });
          setIsCustomActivityOpen(false);
          fetchNewActivities();
      } else {
          toast({ title: "Error", description: result.error || "Failed to add custom activity.", variant: "destructive" });
      }
  };
  
  const currentActivity = !isLoading && !showEndOfList && activities.length > 0 
    ? activities[currentActivityIndex] 
    : null;

  if (isLoading && activities.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{locationStatusMessage || "Loading local activities..."}</p>
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
          <CardTitle className="text-3xl font-headline text-primary">{meetModule?.name || "Plando Meet"}</CardTitle>
          <CardDescription className="text-md text-muted-foreground">Discover and swipe on activities happening around you!</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[480px] p-4 sm:p-6">
           <div className="mb-4">
            <Dialog open={isCustomActivityOpen} onOpenChange={setIsCustomActivityOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Activity
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a Custom Activity</DialogTitle>
                        <DialogDescription>
                            Have a specific idea for an activity? Add it here.
                        </DialogDescription>
                    </DialogHeader>
                    <CustomActivityForm onAddActivity={handleAddCustomActivity} />
                </DialogContent>
            </Dialog>
           </div>
          {locationStatusMessage && (
            <div className="mb-3 text-xs text-muted-foreground p-2 border border-dashed rounded-md flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70"/> 
                <span>{locationStatusMessage}</span>
            </div>
          )}
          {isLoading && activities.length > 0 && (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Reloading activities...</p>
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
                  ? `No local activities found for ${currentLocationKey === "Default" ? "your area" : currentLocationKey}.` 
                  : "You've swiped through all local activities!"}
              </p>
              <p className="text-sm">Check back later for new suggestions or reset the deck.</p>
              <Button onClick={handleResetDeck} variant="outline" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset Activities
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
