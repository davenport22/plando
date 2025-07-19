
"use client";

import { useState, useEffect } from 'react';
import type { Activity, UserProfile } from '@/types';
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, RotateCcw, MapPin, PlusCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { plandoModules } from "@/config/plandoModules";
import { useLocalActivities } from '@/hooks/useLocalActivities';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CustomActivityForm } from '@/components/activities/CustomActivityForm';
import { addCustomFriendActivity, connectFriend, disconnectFriend, getUserProfile } from '@/lib/actions';
import { FriendConnection } from '@/components/friends/FriendConnection';
import { Separator } from '@/components/ui/separator';

export default function PlandoFriendsPage() {
  const { toast } = useToast();
  const { userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const friendsModule = plandoModules.find(m => m.id === 'friends');
  const Icon = friendsModule?.Icon || Users;

  const [connectedFriend, setConnectedFriend] = useState<UserProfile | null>(null);

  // Load friend data and then pass it to the activity hook
  useEffect(() => {
    if (userProfile?.friendId) {
        getUserProfile(userProfile.friendId).then(friend => {
            if (friend) {
                setConnectedFriend(friend);
            }
        });
    } else {
        setConnectedFriend(null);
    }
  }, [userProfile]);

  const { 
    activities, 
    setActivities, 
    isLoading, 
    locationStatusMessage, 
    currentLocationKey, 
    fetchActivities: fetchNewActivities 
  } = useLocalActivities('friends', userProfile, connectedFriend);
  
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showEndOfList, setShowEndOfList] = useState(false);
  
  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);

  const [isCustomActivityOpen, setIsCustomActivityOpen] = useState(false);
  
  // Friend connection state
  const [friendEmailInput, setFriendEmailInput] = useState("");
  const [isConnectingFriend, setIsConnectingFriend] = useState(false);


  useEffect(() => {
    setCurrentActivityIndex(0);
    setShowEndOfList(activities.length > 0 ? false : true);
  }, [activities]);

  const handleVote = (activityId: string, liked: boolean) => {
    // This is a placeholder for voting logic. For now, it just advances the card.
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
      const result = await addCustomFriendActivity(userProfile.id, data);
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

  const handleConnectFriend = async () => {
    if (!friendEmailInput.trim() || !userProfile) {
      toast({ title: "Error", description: "Please enter your friend's email.", variant: "destructive" });
      return;
    }
    if (friendEmailInput.trim().toLowerCase() === userProfile.email.toLowerCase()) {
      toast({ title: "Oops!", description: "You can't connect with yourself.", variant: "destructive" });
      return;
    }
    setIsConnectingFriend(true);
    
    const result = await connectFriend(userProfile.id, friendEmailInput.trim().toLowerCase());

    if (result.success && result.friend) {
      await refreshUserProfile();
      toast({ title: "Friend Connected!", description: `You are now connected with ${result.friend.name}.` });
      setFriendEmailInput("");
    } else {
      toast({ title: "Connection Failed", description: result.error || "Please check the email and try again.", variant: "destructive" });
    }
    setIsConnectingFriend(false);
  };

  const handleDisconnectFriend = async () => {
    if (connectedFriend && userProfile) {
      const result = await disconnectFriend(userProfile.id);
      if(result.success) {
        toast({ title: "Friend Disconnected", description: `You are no longer connected with ${connectedFriend.name}.` });
        await refreshUserProfile();
      } else {
        toast({ title: "Error", description: result.error || "Could not disconnect friend.", variant: "destructive" });
      }
    }
  };
  
  const currentActivity = !isLoading && !showEndOfList && activities.length > 0 
    ? activities[currentActivityIndex] 
    : null;

  if (isLoading && activities.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{locationStatusMessage || "Loading local activities for friends..."}</p>
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
          <CardTitle className="text-3xl font-headline text-primary">{friendsModule?.name || "Plando Friends"}</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
             {connectedFriend 
              ? `Finding activities for you and ${connectedFriend.name}!` 
              : "Discover activities. Connect with a friend to share ideas!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[520px] p-4 sm:p-6">
          <div className="mb-6 p-4 border rounded-lg bg-muted/30 w-full">
             <FriendConnection
              connectedFriend={connectedFriend}
              isConnecting={isConnectingFriend}
              friendEmailInput={friendEmailInput}
              setFriendEmailInput={setFriendEmailInput}
              handleConnectFriend={handleConnectFriend}
              handleDisconnectFriend={handleDisconnectFriend}
            />
          </div>
          
          <Separator className="my-4" />

          <div className="mb-4">
            <Dialog open={isCustomActivityOpen} onOpenChange={setIsCustomActivityOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Activity
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a Custom Friend Activity</DialogTitle>
                        <DialogDescription>
                            Have a specific idea for an activity with friends? Add it here.
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
          
           {!connectedFriend ? (
                <div className="text-center text-muted-foreground space-y-4 py-8">
                    <UserPlus className="h-20 w-20 mx-auto text-primary/40" />
                    <p className="text-xl font-semibold text-foreground">Connect with a friend</p>
                    <p>
                        Please connect with a friend first to start swiping on activity ideas.
                    </p>
                </div>
            ) : isLoading && activities.length > 0 ? ( 
              <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Reloading friend activities...</p>
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
                {activities.length === 0 
                  ? `No local friend activities found for ${currentLocationKey === "Default" ? "your area" : currentLocationKey}.` 
                  : "You've swiped through all local friend activities!"}
              </p>
              <p className="text-sm">Check back later or reset the deck.</p>
              <Button onClick={handleResetDeck} variant="outline" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reset Friend Activities
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
