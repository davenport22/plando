
"use client";

import { useState, useEffect } from 'react';
import type { Activity, UserProfile } from '@/types';
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, RotateCcw, MapPin, ListChecks, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle as MatchDialogTitle } from "@/components/ui/dialog";
import { plandoModules } from "@/config/plandoModules";
import Link from 'next/link';
import { PartnerConnection } from '@/components/couples/PartnerConnection';
import { useLocalActivities } from '@/hooks/useLocalActivities';
import { saveCoupleVote, getLikedCouplesActivityIds, connectPartner, disconnectPartner, getUserProfile } from '@/lib/actions';
import { useAuth } from '@/context/AuthContext';


export default function PlandoCouplesPage() {
  const { toast } = useToast();
  const { userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const couplesModule = plandoModules.find(m => m.id === 'couples');
  const Icon = couplesModule?.Icon || Heart;

  const { 
    activities, 
    isLoading, 
    locationStatusMessage, 
    currentLocationKey, 
    fetchActivities: fetchNewActivities,
    setVotedActivityIds,
    votedActivityIds
  } = useLocalActivities('couples', userProfile);

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showEndOfList, setShowEndOfList] = useState(false);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);
  
  const [likedActivitiesCount, setLikedActivitiesCount] = useState(0);

  // Partner selection state
  const [partnerEmailInput, setPartnerEmailInput] = useState("");
  const [connectedPartner, setConnectedPartner] = useState<UserProfile | null>(null);
  const [isConnectingPartner, setIsConnectingPartner] = useState(false);
  const [partnerLikedActivityIds, setPartnerLikedActivityIds] = useState<string[]>([]);

  // Match animation state
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchedAnimationActivityName, setMatchedAnimationActivityName] = useState<string>("");
  
  // This effect will run when activities are loaded or reloaded by the hook
  useEffect(() => {
    setCurrentActivityIndex(0);
    setShowEndOfList(activities.length > 0 ? false : true);
  }, [activities]);

  // Load initial data on mount
  useEffect(() => {
    if (userProfile) {
      // Fetch liked count from DB
      getLikedCouplesActivityIds(userProfile.id).then(ids => {
        setLikedActivitiesCount(ids.length);
      });

      // Load partner from userProfile
      if (userProfile.partnerId) {
        getUserProfile(userProfile.partnerId).then(partner => {
          if (partner) {
            setConnectedPartner(partner);
            getLikedCouplesActivityIds(partner.id).then(setPartnerLikedActivityIds);
          }
        });
      } else {
        setConnectedPartner(null);
        setPartnerLikedActivityIds([]);
      }
    }
  }, [userProfile]);

  const handleVote = async (activityId: string, liked: boolean) => {
    if (!userProfile) return;

    const votedActivity = activities.find(act => act.id === activityId);
    if (!votedActivity) return;

    setVotedActivityIds(prev => new Set(prev).add(activityId));

    const { success, error } = await saveCoupleVote(userProfile.id, activityId, liked);

    if (success) {
      toast({
        title: liked ? "Date Idea Liked!" : "Date Idea Skipped",
        description: `You ${liked ? 'liked' : 'skipped'} "${votedActivity.name}".`,
      });
    } else {
      toast({ title: "Error", description: error || "Could not save your vote.", variant: "destructive" });
      setVotedActivityIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(activityId);
          return newSet;
      });
      return; // Stop processing if vote failed to save
    }

    if (liked) {
      setLikedActivitiesCount(prev => prev + 1);
      // Check for match animation
      if (connectedPartner && partnerLikedActivityIds.includes(votedActivity.id)) {
        setMatchedAnimationActivityName(votedActivity.name);
        setShowMatchAnimation(true);
        setTimeout(() => {
          setShowMatchAnimation(false);
        }, 3500); // Auto-close after 3.5 seconds
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
    fetchNewActivities();
  };

  const handleConnectPartner = async () => {
    if (!partnerEmailInput.trim() || !userProfile) {
      toast({ title: "Error", description: "Please enter your partner's email.", variant: "destructive" });
      return;
    }
    setIsConnectingPartner(true);
    
    const result = await connectPartner(userProfile.id, partnerEmailInput.trim().toLowerCase());

    if (result.success && result.partner) {
      await refreshUserProfile(); // Refresh auth context which will trigger useEffect to update state
      toast({ title: "Partner Connected!", description: `You are now connected with ${result.partner.name}.` });
      setPartnerEmailInput("");
    } else {
      toast({ title: "Connection Failed", description: result.error || "Please check the email and try again.", variant: "destructive" });
    }
    setIsConnectingPartner(false);
  };

  const handleDisconnectPartner = async () => {
    if (connectedPartner && userProfile) {
      const result = await disconnectPartner(userProfile.id);
      if(result.success) {
        toast({ title: "Partner Disconnected", description: `You are no longer connected with ${connectedPartner.name}.` });
        await refreshUserProfile(); // Refresh auth context which will trigger useEffect
      } else {
        toast({ title: "Error", description: result.error || "Could not disconnect partner.", variant: "destructive" });
      }
    }
  };
  
  const currentActivity = !isLoading && !showEndOfList && activities.length > 0 
    ? activities[currentActivityIndex] 
    : null;

  if ((isLoading && activities.length === 0) || authLoading) { 
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{authLoading ? "Loading your profile..." : locationStatusMessage || "Loading local date ideas..."}</p>
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
          <CardTitle className="text-3xl font-headline text-primary">{couplesModule?.name || "Plando Couples"}</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            {connectedPartner 
              ? `Finding romantic activities for you and ${connectedPartner.name}!` 
              : "Discover and swipe on romantic activities. Connect with your partner to share ideas!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <PartnerConnection
              connectedPartner={connectedPartner}
              isConnecting={isConnectingPartner}
              partnerEmailInput={partnerEmailInput}
              setPartnerEmailInput={setPartnerEmailInput}
              handleConnectPartner={handleConnectPartner}
              handleDisconnectPartner={handleDisconnectPartner}
            />
          </div>
          
          <Separator className="my-6" />

           {locationStatusMessage && (
            <div className="mb-3 text-xs text-muted-foreground p-2 border border-dashed rounded-md flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70"/> 
                <span>{locationStatusMessage}</span>
            </div>
          )}
          <div className="flex flex-col items-center justify-center min-h-[380px]">
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
              <div className="text-center text-muted-foreground space-y-4 py-8">
                <Users className="h-20 w-20 mx-auto text-primary/40" />
                <p className="text-xl">
                  {votedActivityIds.size > 0 && activities.length === 0
                    ? "You've swiped through all local date ideas!"
                    : `No local date ideas found for ${currentLocationKey === "Default" ? "your area" : currentLocationKey}.` 
                  }
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
                      View Matched Ideas ({likedActivitiesCount})
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {!isLoading && !currentActivity && activities.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/plando-couples/matches" passHref>
              <Button variant="default" size="lg" disabled={likedActivitiesCount === 0}>
                <ListChecks className="mr-2 h-5 w-5" />
                View Your Matched Date Ideas ({likedActivitiesCount})
              </Button>
            </Link>
        </div>
      )}
      
      {currentActivity && (
         <div className="mt-6">
            <Link href="/plando-couples/matches" passHref>
              <Button variant="secondary" disabled={likedActivitiesCount === 0}>
                <ListChecks className="mr-2 h-4 w-4" />
                View Matched Ideas ({likedActivitiesCount})
              </Button>
            </Link>
        </div>
      )}

      <ActivityDetailDialog 
        activity={selectedActivityForDialog}
        isOpen={isActivityDetailDialogOpen}
        onOpenChange={setIsActivityDetailDialogOpen}
      />

      <Dialog open={showMatchAnimation} onOpenChange={setShowMatchAnimation}>
        <DialogContent className="sm:max-w-md text-center p-8">
          <DialogHeader className="space-y-4">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse">
              <Heart className="h-12 w-12 text-primary animate-ping" style={{ animationDuration: '1.5s' }} />
              <Sparkles className="absolute h-16 w-16 text-accent/70 opacity-75 animate-spin" style={{ animationDuration: '3s' }}/>
            </div>
            <MatchDialogTitle className="text-3xl font-headline text-primary">It's a Match!</MatchDialogTitle>
            <CardDescription className="text-lg">
              You and {connectedPartner?.name || 'your partner'} both liked <br />
              <span className="font-semibold text-foreground">{matchedAnimationActivityName}</span>!
            </CardDescription>
          </DialogHeader>
          <Link href="/plando-couples/matches" passHref>
            <Button className="mt-4 w-full" onClick={() => setShowMatchAnimation(false)}>
              See All Matches
            </Button>
          </Link>
        </DialogContent>
      </Dialog>

    </div>
  );
}
