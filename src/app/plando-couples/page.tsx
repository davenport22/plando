
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Activity, UserProfile } from '@/types';
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, RotateCcw, MapPin, ListChecks, Sparkles, Users, PlusCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { plandoModules } from "@/config/plandoModules";
import Link from 'next/link';
import { PartnerConnection } from '@/components/couples/PartnerConnection';
import { useLocalActivities } from '@/hooks/useLocalActivities';
import { saveCoupleVote, getLikedCouplesActivityIds, disconnectPartner, getUserProfile, addCustomCoupleActivity } from '@/lib/actions';
import { useAuth } from '@/context/AuthContext';
import { CustomActivityForm } from '@/components/activities/CustomActivityForm';


export default function PlandoCouplesPage() {
  const { toast } = useToast();
  const { userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const couplesModule = plandoModules.find(m => m.id === 'couples');
  const Icon = couplesModule?.Icon || Heart;
  
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showEndOfList, setShowEndOfList] = useState(false);

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);
  
  const [userLikedActivityIds, setUserLikedActivityIds] = useState<string[]>([]);

  const [connectedPartner, setConnectedPartner] = useState<UserProfile | null>(null);
  const [partnerLikedActivityIds, setPartnerLikedActivityIds] = useState<string[]>([]);

  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchedAnimationActivityName, setMatchedAnimationActivityName] = useState<string>("");

  const [isCustomActivityOpen, setIsCustomActivityOpen] = useState(false);

  const fetchPartnerData = useCallback(async () => {
    if (userProfile?.partnerId) {
        const partner = await getUserProfile(userProfile.partnerId);
        if (partner) {
            setConnectedPartner(partner);
            const likedIds = await getLikedCouplesActivityIds(partner.id);
            setPartnerLikedActivityIds(likedIds);
        }
    } else {
        setConnectedPartner(null);
        setPartnerLikedActivityIds([]);
    }
  }, [userProfile]);
  
  useEffect(() => {
    fetchPartnerData();
  }, [fetchPartnerData]);

  const { 
    activities, 
    isLoading, 
    locationStatusMessage, 
    currentLocationKey, 
    fetchActivities: fetchNewActivities,
    setVotedActivityIds,
    votedActivityIds
  } = useLocalActivities('couples', userProfile, connectedPartner);
  
  useEffect(() => {
    setCurrentActivityIndex(0);
    setShowEndOfList(activities.length > 0 ? false : true);
  }, [activities]);

  useEffect(() => {
    if (userProfile) {
      getLikedCouplesActivityIds(userProfile.id).then(setUserLikedActivityIds);
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
      return; 
    }

    if (liked) {
      setUserLikedActivityIds(prev => [...prev, activityId]);
      if (connectedPartner && partnerLikedActivityIds.includes(votedActivity.id)) {
        setMatchedAnimationActivityName(votedActivity.name);
        setShowMatchAnimation(true);
        setTimeout(() => setShowMatchAnimation(false), 3500);
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
    toast({ title: "Checking for new date ideas...", description: `Reloading activities for ${currentLocationKey}.`});
    fetchNewActivities();
  };

  const onConnectionChanged = async () => {
      await refreshUserProfile();
      await fetchPartnerData();
  }
  
  const handleDisconnectPartner = async () => {
    if (connectedPartner && userProfile) {
      const result = await disconnectPartner(userProfile.id);
      if(result.success) {
        toast({ title: "Partner Disconnected", description: `You are no longer connected with ${connectedPartner.name}.` });
        onConnectionChanged();
      } else {
        toast({ title: "Error", description: result.error || "Could not disconnect partner.", variant: "destructive" });
      }
    }
  };
  
  const handleAddCustomActivity = async (data: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'participants' | 'category' | 'startTime'>) => {
      if (!userProfile) return;
      const result = await addCustomCoupleActivity(userProfile.id, data);
      if (result.success && result.activity) {
          toast({
              title: "Custom Date Idea Added!",
              description: `"${result.activity.name}" has been added and liked. Your partner will see it soon!`,
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

  const matchesCount = connectedPartner 
    ? userLikedActivityIds.filter(id => partnerLikedActivityIds.includes(id)).length
    : 0;

  if (authLoading) { 
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your profile...</p>
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
              ? `Finding date ideas for you and ${connectedPartner.name}!` 
              : "Discover and swipe on date ideas. Connect with your partner to share ideas!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4">
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <PartnerConnection
              currentUser={userProfile}
              connectedPartner={connectedPartner}
              handleDisconnectPartner={handleDisconnectPartner}
              onConnectionChanged={onConnectionChanged}
            />
          </div>
          
          <Separator className="my-6" />

          <div className="flex justify-center gap-2 mb-4">
            <Link href="/plando-couples/matches" passHref>
                <Button variant="secondary" disabled={!connectedPartner}>
                    <ListChecks className="mr-2 h-4 w-4" />
                    View Matches ({matchesCount})
                </Button>
            </Link>
            <Dialog open={isCustomActivityOpen} onOpenChange={setIsCustomActivityOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" disabled={!connectedPartner}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Custom
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a Custom Date Idea</DialogTitle>
                        <DialogDescription>
                            Have a specific idea? Add it here. Your partner will be able to swipe on it too. It will be automatically 'liked' for you.
                        </DialogDescription>
                    </DialogHeader>
                    <CustomActivityForm onAddActivity={handleAddCustomActivity} />
                </DialogContent>
            </Dialog>
        </div>

           {locationStatusMessage && connectedPartner && (
            <div className="mb-3 text-xs text-muted-foreground p-2 border border-dashed rounded-md flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70"/> 
                <span>{locationStatusMessage}</span>
            </div>
          )}
          <div className="flex flex-col items-center justify-center min-h-[380px]">
             {!connectedPartner ? (
                <div className="text-center text-muted-foreground space-y-4 py-8">
                    <UserPlus className="h-20 w-20 mx-auto text-primary/40" />
                    <p className="text-xl font-semibold text-foreground">Connect with a partner</p>
                    <p>
                        Please connect with your partner first to start swiping on date ideas together.
                    </p>
                </div>
            ) : isLoading && activities.length === 0 ? ( 
              <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Loading date ideas...</p>
              </div>
            ) : !isLoading && currentActivity ? (
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
                  {activities.length === 0 && votedActivityIds.size > 0
                    ? "You've swiped through all available date ideas!"
                    : `No date ideas found. Add a custom one to get started!` 
                  }
                </p>
                <p className="text-sm">Check back later or add your own custom activities!</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={handleResetDeck} variant="outline" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                    Check for new date ideas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
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
            <DialogTitle className="text-3xl font-headline text-primary">It's a Match!</DialogTitle>
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
