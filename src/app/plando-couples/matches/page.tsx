
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Activity, MatchedActivity, UserProfile } from '@/types'; 
import { MOCK_USER_PROFILE, MOCK_COUPLES_ACTIVITIES_BY_CITY } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, ListChecks, UserCheck, Sparkles, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchedActivityCard } from '@/components/activities/MatchedActivityCard';
import { useToast } from '@/hooks/use-toast';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { getLikedCouplesActivityIds, saveCoupleVote } from '@/lib/actions';

const LOCAL_STORAGE_CONNECTED_PARTNER_KEY = `plandoCouplesConnectedPartner_${MOCK_USER_PROFILE.id}`;

export default function PlandoCouplesMatchesPage() {
  const [matchedActivities, setMatchedActivities] = useState<MatchedActivity[]>([]);
  const [userLikedActivitiesCount, setUserLikedActivitiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [connectedPartner, setConnectedPartner] = useState<UserProfile | null>(null);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  useEffect(() => {
    // Load connected partner from localStorage on initial render
    const storedPartner = localStorage.getItem(LOCAL_STORAGE_CONNECTED_PARTNER_KEY);
    if (storedPartner) {
        try {
            setConnectedPartner(JSON.parse(storedPartner));
        } catch (e) {
            console.error("Error parsing connected partner from localStorage", e);
            localStorage.removeItem(LOCAL_STORAGE_CONNECTED_PARTNER_KEY); 
        }
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);

    const userLikedIds = await getLikedCouplesActivityIds(MOCK_USER_PROFILE.id);
    setUserLikedActivitiesCount(userLikedIds.length);

    if (!connectedPartner) {
        setMatchedActivities([]);
        setIsLoading(false);
        return;
    }

    const partnerLikedIds = await getLikedCouplesActivityIds(connectedPartner.id);

    const mutualIds = userLikedIds.filter(id => partnerLikedIds.includes(id));

    // Get the full activity objects from the mock data source
    const allPossibleActivities = MOCK_COUPLES_ACTIVITIES_BY_CITY[MOCK_USER_PROFILE.location] || MOCK_COUPLES_ACTIVITIES_BY_CITY["Default"];
    
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
  }, [connectedPartner]);


  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleClearLikes = async () => {
    // This now clears the likes from the backend by re-saving them as "disliked".
    // A more robust implementation might have a "delete" action.
    const userLikedIds = await getLikedCouplesActivityIds(MOCK_USER_PROFILE.id);
    
    if (userLikedIds.length === 0) {
        toast({ title: "No Likes to Clear", description: "You haven't liked any date ideas yet." });
        return;
    }

    toast({ title: "Clearing Likes...", description: "Please wait while we update your preferences." });
    
    const clearPromises = userLikedIds.map(id => saveCoupleVote(MOCK_USER_PROFILE.id, id, false));
    await Promise.all(clearPromises);
    
    setMatchedActivities([]);
    setUserLikedActivitiesCount(0);
    toast({ title: "Cleared!", description: "Your liked date ideas have been cleared. Any mutual matches are also removed." });
  };

  const handleOpenActivityDetail = (activity: MatchedActivity) => {
    const fullActivity: Activity = {
        ...activity, 
        isLiked: true, // Since it's a matched activity, the current user liked it.
    };
    setSelectedActivityForDialog(fullActivity);
    setIsActivityDetailDialogOpen(true);
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Finding mutual date ideas...</p>
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
    if (matchedActivities.length === 0) {
      return {
        title: "No Mutual Date Ideas Yet!",
        description: `It looks like you and ${connectedPartner.name} haven't mutually liked any activities yet. Keep swiping, or ensure your partner has also liked some of the same ideas!`,
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
        <div>
            <h1 className="text-3xl font-headline text-primary text-center">
              Our Matched Date Ideas
            </h1>
            {connectedPartner && (
                <p className="text-sm text-muted-foreground text-center mt-1">
                    <UserCheck className="inline h-4 w-4 mr-1 text-green-500" />
                    Viewing matches with {connectedPartner.name}.
                </p>
            )}
        </div>
        <Button variant="ghost" onClick={handleClearLikes} disabled={userLikedActivitiesCount === 0}>
          Clear My Likes
        </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchedActivities.map((activity) => (
            <MatchedActivityCard 
                key={activity.id} 
                activity={activity} 
                onCardClick={() => handleOpenActivityDetail(activity)}
            />
          ))}
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
