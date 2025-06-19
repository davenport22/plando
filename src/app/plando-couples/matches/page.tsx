
"use client";

import { useState, useEffect } from 'react';
import type { Activity, MatchedActivity, UserProfile } from '@/types'; 
import { MOCK_USER_PROFILE } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HeartCrack, Info, ListChecks, UserCheck, Sparkles } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [connectedPartner, setConnectedPartner] = useState<UserProfile | null>(null);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  useEffect(() => {
    // Load connected partner from localStorage
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
    setIsLoading(true);
    try {
      const storedLikedActivities = localStorage.getItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
      if (storedLikedActivities) {
        const parsedActivities: Activity[] = JSON.parse(storedLikedActivities);
        
        const transformedActivities: MatchedActivity[] = parsedActivities.map(act => {
            let partnerLikedThisSpecificActivity = true; // Default: partner also liked

            if (connectedPartner && connectedPartner.email === JULIA_EMAIL) {
                // Apply Julia's specific preferences for Vienna activities
                if (act.id === 'couples-vienna-1') partnerLikedThisSpecificActivity = true;  // Danube Cruise - Liked
                else if (act.id === 'couples-vienna-2') partnerLikedThisSpecificActivity = true;  // Belvedere - Liked
                else if (act.id === 'couples-vienna-3') partnerLikedThisSpecificActivity = false; // Wine Tasting - Disliked
                // For other activities, it defaults to true (as per previous simulation)
            }

            return {
                ...act,
                matchedDate: new Date().toISOString(), 
                partnerAlsoLiked: partnerLikedThisSpecificActivity, 
            };
        });
        setMatchedActivities(transformedActivities);
      }
    } catch (e) {
      console.error("Error loading liked activities from localStorage", e);
      toast({title: "Error", description: "Could not load your liked date ideas.", variant: "destructive"});
    }
    setIsLoading(false);
  }, [toast, connectedPartner]); // Re-run when connectedPartner changes

  const handleClearMatches = () => {
    localStorage.removeItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
    setMatchedActivities([]);
    toast({ title: "Cleared!", description: "Your liked date ideas have been cleared." });
  };

  const handleOpenActivityDetail = (activity: MatchedActivity) => {
    const fullActivity: Activity = {
        ...activity, 
        isLiked: true, 
    };
    setSelectedActivityForDialog(fullActivity);
    setIsActivityDetailDialogOpen(true);
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p>Loading your liked date ideas...</p>
      </div>
    );
  }

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
            <h1 className="text-3xl font-headline text-primary text-center">Your Liked Date Ideas</h1>
            {connectedPartner && (
                <p className="text-sm text-muted-foreground text-center mt-1">
                    <UserCheck className="inline h-4 w-4 mr-1 text-green-500" />
                    Viewing with {connectedPartner.name}. 
                    {connectedPartner.email === JULIA_EMAIL && " (Julia's preferences applied)"}
                </p>
            )}
        </div>
        <Button variant="destructive" onClick={handleClearMatches} disabled={matchedActivities.length === 0}>
          <HeartCrack className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      {matchedActivities.length === 0 ? (
        <Card className="text-center py-10 shadow-lg">
          <CardHeader>
            <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-3">
                <ListChecks className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">No Liked Ideas Yet!</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">
              Go back and swipe right on some date ideas you both might enjoy. They'll appear here!
            </CardDescription>
            <Link href="/plando-couples" passHref>
              <Button className="mt-6" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Find Date Ideas
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
