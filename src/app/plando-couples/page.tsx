
"use client";

import { useState, useEffect } from 'react';
import type { Activity, UserProfile } from '@/types';
import { MOCK_USER_PROFILE, MOCK_POTENTIAL_PARTNERS, JULIA_MOCKED_LIKES } from '@/types'; 
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, RotateCcw, MapPin, ListChecks, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle as MatchDialogTitle } from "@/components/ui/dialog";
import { plandoModules } from "@/config/plandoModules";
import Link from 'next/link';
import { PartnerConnection } from '@/components/couples/PartnerConnection';
import { useLocalActivities } from '@/hooks/useLocalActivities';

const LOCAL_STORAGE_LIKED_ACTIVITIES_KEY = `plandoCouplesLikedActivities_${MOCK_USER_PROFILE.id}`;
const LOCAL_STORAGE_CONNECTED_PARTNER_KEY = `plandoCouplesConnectedPartner_${MOCK_USER_PROFILE.id}`;
const JULIA_EMAIL = 'julia.musterfrau@gmail.com';


export default function PlandoCouplesPage() {
  const { toast } = useToast();
  const couplesModule = plandoModules.find(m => m.id === 'couples');
  const Icon = couplesModule?.Icon || Heart;

  const { 
    activities, 
    setActivities, 
    isLoading, 
    locationStatusMessage, 
    currentLocationKey, 
    fetchActivities: fetchNewActivities 
  } = useLocalActivities('couples');

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showEndOfList, setShowEndOfList] = useState(false);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);
  
  const [likedActivitiesCount, setLikedActivitiesCount] = useState(0);

  // Partner selection state
  const [partnerEmailInput, setPartnerEmailInput] = useState("");
  const [connectedPartner, setConnectedPartner] = useState<UserProfile | null>(null);
  const [isConnectingPartner, setIsConnectingPartner] = useState(false);

  // Match animation state
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchedAnimationActivityName, setMatchedAnimationActivityName] = useState<string>("");
  
  // This effect will run when activities are loaded or reloaded by the hook
  useEffect(() => {
    setCurrentActivityIndex(0);
    setShowEndOfList(activities.length > 0 ? false : true);
  }, [activities]);

  useEffect(() => {
    const storedLikedActivities = localStorage.getItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
    if (storedLikedActivities) {
      try {
        const parsedActivities: Activity[] = JSON.parse(storedLikedActivities);
        setLikedActivitiesCount(parsedActivities.length);
      } catch (e) {
        console.error("Error parsing liked activities from localStorage", e);
      }
    }

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
        if (!currentLiked.find(act => act.id === votedActivity.id)) {
          const updatedLiked = [...currentLiked, votedActivity];
          localStorage.setItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY, JSON.stringify(updatedLiked));
          setLikedActivitiesCount(updatedLiked.length);
        }
      } catch (e) {
        console.error("Error saving liked activity to localStorage", e);
        toast({ title: "Error", description: "Could not save liked activity preference.", variant: "destructive"});
      }

      // Check for match animation
      if (connectedPartner && connectedPartner.email === JULIA_EMAIL && JULIA_MOCKED_LIKES.includes(votedActivity.id)) {
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
    if (!partnerEmailInput.trim()) {
      toast({ title: "Error", description: "Please enter your partner's email.", variant: "destructive" });
      return;
    }
    setIsConnectingPartner(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const foundPartner = MOCK_POTENTIAL_PARTNERS.find(p => p.email.toLowerCase() === partnerEmailInput.trim().toLowerCase());

    if (foundPartner) {
      if (foundPartner.id === MOCK_USER_PROFILE.id) {
        toast({ title: "Oops!", description: "You can't connect with yourself as a partner.", variant: "destructive" });
      } else {
        setConnectedPartner(foundPartner);
        localStorage.setItem(LOCAL_STORAGE_CONNECTED_PARTNER_KEY, JSON.stringify(foundPartner));
        toast({ title: "Partner Connected!", description: `You are now connected with ${foundPartner.name}.` });
        setPartnerEmailInput("");
      }
    } else {
      toast({ title: "Partner Not Found", description: "Could not find a user with that email. Please check and try again.", variant: "destructive" });
    }
    setIsConnectingPartner(false);
  };

  const handleDisconnectPartner = () => {
    if (connectedPartner) {
      toast({ title: "Partner Disconnected", description: `You are no longer connected with ${connectedPartner.name}.` });
      setConnectedPartner(null);
      localStorage.removeItem(LOCAL_STORAGE_CONNECTED_PARTNER_KEY);
    }
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
          </div>
        </CardContent>
      </Card>
      
      {!isLoading && !currentActivity && activities.length > 0 && (
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
          {/* Auto-closes via setTimeout in handleVote */}
        </DialogContent>
      </Dialog>

    </div>
  );
}
