
"use client";

import { useState, useEffect } from 'react';
import type { Activity, MatchedActivity } from '@/types'; 
import { MOCK_USER_PROFILE } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HeartCrack, Info, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchedActivityCard } from '@/components/activities/MatchedActivityCard';
import { useToast } from '@/hooks/use-toast';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';

const LOCAL_STORAGE_LIKED_ACTIVITIES_KEY = `plandoCouplesLikedActivities_${MOCK_USER_PROFILE.id}`;

export default function PlandoCouplesMatchesPage() {
  const [matchedActivities, setMatchedActivities] = useState<MatchedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const storedLikedActivities = localStorage.getItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
      if (storedLikedActivities) {
        const parsedActivities: Activity[] = JSON.parse(storedLikedActivities);
        // Transform to MatchedActivity structure
        const transformedActivities: MatchedActivity[] = parsedActivities.map(act => ({
            ...act, // Spread all original activity properties
            matchedDate: new Date().toISOString(), // Add a mock matched date
            partnerAlsoLiked: true, // Simulate partner also liked for prototype
        }));
        setMatchedActivities(transformedActivities);
      }
    } catch (e) {
      console.error("Error loading liked activities from localStorage", e);
      toast({title: "Error", description: "Could not load your liked date ideas.", variant: "destructive"});
    }
    setIsLoading(false);
  }, [toast]);

  const handleClearMatches = () => {
    localStorage.removeItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
    setMatchedActivities([]);
    toast({ title: "Cleared!", description: "Your liked date ideas have been cleared." });
  };

  const handleOpenActivityDetail = (activity: MatchedActivity) => {
    // We need to find the original full Activity object if MOCK_COUPLES_ACTIVITIES_BY_CITY has it
    // Or construct a basic Activity object from MatchedActivity
    
    // For simplicity, we'll assume MatchedActivity has enough info or we can find it
    // This might need adjustment if MatchedActivity is too lean
    const fullActivity: Activity = {
        ...activity, // Spread matched activity (which already includes most Activity fields)
        isLiked: true, // Assuming it's liked if it's in matches
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
        <h1 className="text-3xl font-headline text-primary">Your Liked Date Ideas</h1>
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
                <Info className="mr-2 h-5 w-5" />
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
