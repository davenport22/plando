
"use client";

import { useState, useEffect } from 'react';
import type { Activity } from '@/types';
import { MOCK_LOCAL_ACTIVITIES } from '@/types'; 
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Users, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { plandoModules } from "@/config/plandoModules";

export default function PlandoMeetPage() {
  const { toast } = useToast();
  const meetModule = plandoModules.find(m => m.id === 'meet');
  const Icon = meetModule?.Icon || Sparkles;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndOfList, setShowEndOfList] = useState(false);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  useEffect(() => {
    // Simulate fetching local activities
    const initialActivities = MOCK_LOCAL_ACTIVITIES.map(act => ({ ...act, isLiked: undefined }));
    setActivities(initialActivities);
    setCurrentActivityIndex(0);
    setShowEndOfList(false);
    setIsLoading(false);
  }, []);

  const handleVote = (activityId: string, liked: boolean) => {
    setActivities(prevActivities =>
      prevActivities.map(act =>
        act.id === activityId ? { ...act, isLiked: liked } : act
      )
    );
    
    toast({
      title: liked ? "Activity Liked!" : "Activity Skipped",
      description: `You ${liked ? 'liked' : 'skipped'} "${activities[currentActivityIndex].name}".`,
    });

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
    setIsLoading(true);
    const resetActivities = MOCK_LOCAL_ACTIVITIES.map(act => ({ ...act, isLiked: undefined }));
    setActivities(resetActivities);
    setCurrentActivityIndex(0);
    setShowEndOfList(false);
    setTimeout(() => setIsLoading(false), 300); // simulate a brief loading
    toast({ title: "Activity Deck Reset", description: "You can now swipe through the local activities again."});
  };
  
  const currentActivity = !isLoading && !showEndOfList && activities.length > 0 
    ? activities[currentActivityIndex] 
    : null;

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading local activities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-xl relative overflow-visible">
        <CardHeader className="pb-4">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">{meetModule?.name || "Plando Meet"}</CardTitle>
          <p className="text-md text-muted-foreground">Discover and swipe on activities happening around you!</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[450px] p-4 sm:p-6">
          {currentActivity ? (
            <div className="w-full max-w-xs sm:max-w-sm">
              <ActivityVotingCard
                key={currentActivity.id}
                activity={currentActivity}
                onVote={handleVote}
                onCardClick={handleOpenActivityDetail}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground space-y-4">
              <Users className="h-20 w-20 mx-auto text-primary/40" />
              <p className="text-xl">
                {activities.length === 0 
                  ? "No local activities available right now." 
                  : "You've swiped through all local activities!"}
              </p>
              <p className="text-sm">Check back later for new suggestions or reset the deck.</p>
              <Button onClick={handleResetDeck} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
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
