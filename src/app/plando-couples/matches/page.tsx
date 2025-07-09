
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Activity, MatchedActivity, UserProfile, CompletedActivity } from '@/types'; 
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCheck, Sparkles, Users, Loader2, History } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchedActivityCard } from '@/components/activities/MatchedActivityCard';
import { useToast } from '@/hooks/use-toast';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { getLikedCouplesActivityIds, getUserProfile, markCoupleActivityAsCompleted, getCustomCouplesActivities, getCompletedCouplesActivities } from '@/lib/actions';
import { useAuth } from '@/context/AuthContext';
import { MarkAsDoneDialog } from '@/components/couples/MarkAsDoneDialog';
import { CompletedActivityCard } from '@/components/couples/CompletedActivityCard';


export default function PlandoCouplesMatchesPage() {
  const { userProfile } = useAuth();
  const [matchedActivities, setMatchedActivities] = useState<MatchedActivity[]>([]);
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [connectedPartner, setConnectedPartner] = useState<UserProfile | null>(null);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);
  
  const [activityToMark, setActivityToMark] = useState<Activity | null>(null);
  const [isMarkAsDoneOpen, setIsMarkAsDoneOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.partnerId) {
        getUserProfile(userProfile.partnerId).then(partner => {
            if (partner) {
                setConnectedPartner(partner);
            }
        });
    }
  }, [userProfile]);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);

    if (!userProfile) {
        setMatchedActivities([]);
        setCompletedActivities([]);
        setIsLoading(false);
        return;
    }

    const completed = await getCompletedCouplesActivities(userProfile.id);
    setCompletedActivities(completed);

    if (!connectedPartner) {
        setMatchedActivities([]);
        setIsLoading(false);
        return;
    }

    const [userLikedIds, partnerLikedIds, allPossibleActivities] = await Promise.all([
      getLikedCouplesActivityIds(userProfile.id),
      getLikedCouplesActivityIds(connectedPartner.id),
      getCustomCouplesActivities()
    ]);
    
    const mutualIds = userLikedIds.filter(id => partnerLikedIds.includes(id));
        
    const mutualActivities = mutualIds.map(id => {
        const activity = allPossibleActivities.find(act => act.id === id);
        if (activity) {
            return {
                ...activity,
                matchedDate: new Date().toISOString(),
                partnerAlsoLiked: true,
            };
        }
        return null;
    }).filter((a): a is MatchedActivity => a !== null);
    
    setMatchedActivities(mutualActivities);
    setIsLoading(false);
  }, [connectedPartner, userProfile]);


  useEffect(() => {
    if (userProfile !== undefined) {
      fetchMatches();
    }
  }, [fetchMatches, userProfile]);

  const handleOpenActivityDetail = (activity: Activity) => {
    setSelectedActivityForDialog(activity);
    setIsActivityDetailDialogOpen(true);
  };
  
  const handleOpenMarkAsDone = (activity: MatchedActivity) => {
    setActivityToMark(activity);
    setIsMarkAsDoneOpen(true);
  };
  
  const handleConfirmMarkAsDone = async (activity: Activity, wouldDoAgain: boolean) => {
    if (!userProfile || !connectedPartner) {
        toast({ title: "Error", description: "Cannot perform action without user or partner information.", variant: "destructive" });
        return;
    }
    
    const result = await markCoupleActivityAsCompleted(userProfile.id, connectedPartner.id, activity, wouldDoAgain);

    if (result.success) {
        toast({ title: "Activity Updated!", description: "The activity has been added to your history." });
        // Refetch all data to update both lists
        fetchMatches();
    } else {
        toast({ title: "Error", description: result.error || "Could not update the activity.", variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Finding your date ideas...</p>
        </div>
      </div>
    );
  }

  const getEmptyStateMessage = () => {
    if (!connectedPartner) {
      return {
        title: "Connect with Your Partner",
        description: "Connect with your partner on the previous page to see your mutual date ideas here!",
        icon: UserCheck
      };
    }
    if (matchedActivities.length === 0 && completedActivities.length === 0) {
      return {
        title: "No Mutual Date Ideas Yet!",
        description: `It looks like you and ${connectedPartner.name} haven't mutually liked any activities. Keep swiping!`,
        icon: Users
      };
    }
    return null;
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <Link href="/plando-couples" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Swiping
          </Button>
        </Link>
        <div className="text-center">
            <h1 className="text-3xl font-headline text-primary">
              Our Date Ideas
            </h1>
            {connectedPartner && (
                <p className="text-sm text-muted-foreground text-center mt-1">
                    <UserCheck className="inline h-4 w-4 mr-1 text-green-500" />
                    Viewing matches & history with {connectedPartner.name}.
                </p>
            )}
        </div>
        <div className="w-[170px]" /> {/* Spacer to balance the back button */}
      </div>

      {emptyState ? (
        <Card className="text-center py-10 shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-3">
                <emptyState.icon className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{emptyState.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              {emptyState.description}
            </p>
            <Link href="/plando-couples" passHref>
              <Button className="mt-6" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                {connectedPartner ? "Find More Dates" : "Go to Swiping"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {matchedActivities.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                  <h2 className="text-2xl font-headline text-foreground">Matched Date Ideas ({matchedActivities.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedActivities.map((activity) => (
                  <MatchedActivityCard 
                      key={activity.id} 
                      activity={activity} 
                      onCardClick={() => handleOpenActivityDetail(activity)}
                      onMarkAsDone={handleOpenMarkAsDone}
                  />
                ))}
              </div>
            </section>
          )}

          {completedActivities.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                  <History className="h-7 w-7 text-green-600" />
                  <h2 className="text-2xl font-headline text-foreground">Cool Stuff We Did ({completedActivities.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedActivities.map((activity) => (
                  <CompletedActivityCard 
                    key={activity.id} 
                    activity={activity} 
                    onCardClick={() => handleOpenActivityDetail(activity)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
       <ActivityDetailDialog 
        activity={selectedActivityForDialog}
        isOpen={isActivityDetailDialogOpen}
        onOpenChange={setIsActivityDetailDialogOpen}
      />
      <MarkAsDoneDialog
        activity={activityToMark}
        isOpen={isMarkAsDoneOpen}
        onOpenChange={setIsMarkAsDoneOpen}
        onConfirm={handleConfirmMarkAsDone}
      />
    </div>
  );
}
