
"use client";

import { useState, useEffect } from 'react';
import type { Activity, UserProfile } from '@/types';
import { MOCK_COUPLES_ACTIVITIES_BY_CITY, MOCK_USER_PROFILE, MOCK_POTENTIAL_PARTNERS } from '@/types'; 
import { ActivityVotingCard } from '@/components/activities/ActivityVotingCard';
import { ActivityDetailDialog } from '@/components/activities/ActivityDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart, RotateCcw, MapPin, ListChecks, UserPlus, Users, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { plandoModules } from "@/config/plandoModules";
import Link from 'next/link';

const LOCAL_STORAGE_LIKED_ACTIVITIES_KEY = `plandoCouplesLikedActivities_${MOCK_USER_PROFILE.id}`;
const LOCAL_STORAGE_CONNECTED_PARTNER_KEY = `plandoCouplesConnectedPartner_${MOCK_USER_PROFILE.id}`;


export default function PlandoCouplesPage() {
  const { toast } = useToast();
  const couplesModule = plandoModules.find(m => m.id === 'couples');
  const Icon = couplesModule?.Icon || Heart;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEndOfList, setShowEndOfList] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [currentLocationKey, setCurrentLocationKey] = useState<string>("Default");

  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<Activity | null>(null);
  const [isActivityDetailDialogOpen, setIsActivityDetailDialogOpen] = useState(false);
  
  const [likedActivitiesCount, setLikedActivitiesCount] = useState(0);

  // Partner selection state
  const [partnerEmailInput, setPartnerEmailInput] = useState("");
  const [connectedPartner, setConnectedPartner] = useState<UserProfile | null>(null);
  const [isConnectingPartner, setIsConnectingPartner] = useState(false);

  useEffect(() => {
    // Load liked activities from localStorage
    const storedLikedActivities = localStorage.getItem(LOCAL_STORAGE_LIKED_ACTIVITIES_KEY);
    if (storedLikedActivities) {
      try {
        const parsedActivities: Activity[] = JSON.parse(storedLikedActivities);
        setLikedActivitiesCount(parsedActivities.length);
      } catch (e) {
        console.error("Error parsing liked activities from localStorage", e);
      }
    }

    // Load connected partner from localStorage
    const storedPartner = localStorage.getItem(LOCAL_STORAGE_CONNECTED_PARTNER_KEY);
    if (storedPartner) {
        try {
            setConnectedPartner(JSON.parse(storedPartner));
        } catch (e) {
            console.error("Error parsing connected partner from localStorage", e);
            localStorage.removeItem(LOCAL_STORAGE_CONNECTED_PARTNER_KEY); // Clear invalid entry
        }
    }

    fetchActivitiesBasedOnLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivitiesBasedOnLocation = async () => {
    setIsLoading(true);
    setLocationStatusMessage("Fetching location and activities for couples...");

    let determinedLocationKey = "Default";
    let statusMsg = "";

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
        statusMsg = `Using profile location for couples activities: ${determinedLocationKey}. (Live location: ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`;
      } catch (error: any) {
        determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
        statusMsg = `Could not get live location for couples activities. Using profile location: ${determinedLocationKey}.`;
        if (error.code === error.PERMISSION_DENIED) {
          statusMsg = `Location access denied for couples activities. Using profile location: ${determinedLocationKey}.`;
        }
      }
    } else {
      determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
      statusMsg = `Geolocation not supported. Using profile location for couples activities: ${determinedLocationKey}.`;
    }
    
    setCurrentLocationKey(determinedLocationKey);
    setLocationStatusMessage(statusMsg);

    const activitiesToShow = (MOCK_COUPLES_ACTIVITIES_BY_CITY[determinedLocationKey] || MOCK_COUPLES_ACTIVITIES_BY_CITY["Default"])
                              .map(act => ({ ...act, isLiked: undefined }));
    
    setActivities(activitiesToShow);
    setCurrentActivityIndex(0);
    setShowEndOfList(activitiesToShow.length === 0);
    setIsLoading(false);
    if (activitiesToShow.length === 0) {
        toast({ title: "No Activities Found", description: `No local couples activities found in ${determinedLocationKey}.`, variant: "default"});
    }
  };


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
    fetchActivitiesBasedOnLocation();
  };

  const handleConnectPartner = async () => {
    if (!partnerEmailInput.trim()) {
      toast({ title: "Error", description: "Please enter your partner's email.", variant: "destructive" });
      return;
    }
    setIsConnectingPartner(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

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

  if (isLoading && activities.length === 0 && !connectedPartner) { // Adjusted initial loading condition
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
          {/* Partner Connection Section */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            {!connectedPartner ? (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">Connect with Your Partner</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="Partner's email address"
                    value={partnerEmailInput}
                    onChange={(e) => setPartnerEmailInput(e.target.value)}
                    disabled={isConnectingPartner}
                    className="flex-grow"
                  />
                  <Button onClick={handleConnectPartner} disabled={isConnectingPartner || !partnerEmailInput.trim()} className="sm:w-auto">
                    {isConnectingPartner ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Connect
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Enter your partner's Plando email to link accounts.</p>
              </>
            ) : (
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-3">Connected with:</h3>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={connectedPartner.avatarUrl || `https://avatar.vercel.sh/${connectedPartner.email}.png`} alt={connectedPartner.name} />
                    <AvatarFallback>{connectedPartner.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{connectedPartner.name}</p>
                    <p className="text-sm text-muted-foreground">{connectedPartner.email}</p>
                  </div>
                </div>
                <Button onClick={handleDisconnectPartner} variant="outline" size="sm" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" /> Disconnect Partner
                </Button>
              </div>
            )}
          </div>
          
          <Separator className="my-6" />

          {/* Activity Swiping Section */}
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
    </div>
  );
}
