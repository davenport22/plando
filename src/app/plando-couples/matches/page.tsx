
"use client";

import { useState, useEffect } from 'react';
import type { Activity, MatchedActivity, UserProfile } from '@/types'; 
import { MOCK_USER_PROFILE } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HeartCrack, Info, ListChecks, UserCheck, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchedActivityCard } from '@/components/activities/MatchedActivityCard';
import { useToast } from '@/hooks/use-toast';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';

const LOCAL_STORAGE_LIKED_ACTIVITIES_KEY = `plandoCouplesLikedActivities_${MOCK_USER_PROFILE.id}`;
const LOCAL_STORAGE_CONNECTED_PARTNER_KEY = `plandoCouplesConnectedPartner_${MOCK_USER_PROFILE.id}`;
const JULIA_EMAIL = 'julia.musterfrau@gmail.com';

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


  useEffect(() => {
    // This effect runs when the component mounts or when the connected partner changes.
    // It calculates the mutual matches.
    setIsLoading(true);
    const storedUserLikedActivities = localStorage.getItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
    let userLikedActivities: Activity[] = [];

    if (storedUserLikedActivities) {
        try {
            userLikedActivities = JSON.parse(storedUserLikedActivities);
        } catch (e) {
            console.error("Error parsing user liked activities from localStorage", e);
            toast({ title: "Error", description: "Could not load your liked activities.", variant: "destructive" });
        }
    }
    setUserLikedActivitiesCount(userLikedActivities.length);

    if (!connectedPartner) {
        // If no partner is connected, there can be no matches.
        setMatchedActivities([]);
    } else {
        const mutuallyLiked: MatchedActivity[] = [];
        for (const userActivity of userLikedActivities) {
            // Default to NO match if partner's vote is unknown or a dislike
            let partnerAlsoLikedThisActivity = false; 

            if (connectedPartner.email === JULIA_EMAIL) {
                // Julia's specific mocked preferences
                if (userActivity.id === 'couples-vienna-1') partnerAlsoLikedThisActivity = true;  // Danube Cruise - Julia Liked
                else if (userActivity.id === 'couples-vienna-2') partnerAlsoLikedThisActivity = true;  // Belvedere - Julia Liked
                else if (userActivity.id === 'couples-vienna-3') partnerAlsoLikedThisActivity = false; // Wine Tasting - Julia Disliked
                // For any other activity the user liked, Julia's vote is unknown, so it's not a confirmed match.
            }
            // For any other connected partner (not Julia), we don't have their specific mock votes.
            // Therefore, we cannot confirm a mutual like. `partnerAlsoLikedThisActivity` remains false.

            if (partnerAlsoLikedThisActivity) {
                mutuallyLiked.push({
                    ...userActivity,
                    matchedDate: new Date().toISOString(), 
                    partnerAlsoLiked: true, // This will always be true for items in this list
                });
            }
        }
        setMatchedActivities(mutuallyLiked);
    }
    setIsLoading(false);
  }, [toast, connectedPartner]);

  const handleClearLikes = () => {
    // This clears the current user's liked activities, which indirectly clears the matches.
    localStorage.removeItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
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
        <p>Loading mutual date ideas...</p>
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
                    {connectedPartner.email === JULIA_EMAIL && " (Julia's specific preferences applied for matches)"}
                </p>
            )}
        </div>
        <Button variant="destructive" onClick={handleClearLikes} disabled={userLikedActivitiesCount === 0}>
          <HeartCrack className="mr-2 h-4 w-4" />
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
