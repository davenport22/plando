
"use client"; // Added "use client" as we'll be handling form state

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Kept for potential future use in other tabs
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_USER_PROFILE, type UserProfile } from "@/types"; // Ensure UserProfile is imported
import { CalendarDays, MapPinIcon } from "lucide-react";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm"; // New import
import { useToast } from "@/hooks/use-toast"; // For feedback on save

const MAX_INTERESTS_DISPLAYED = 6;

export default function ProfilePage() {
  // In a real app, this would come from auth state and be updatable
  const user = MOCK_USER_PROFILE; 
  const { toast } = useToast();

  const interestsToDisplay = user.interests.slice(0, MAX_INTERESTS_DISPLAYED);
  const remainingInterestsCount = user.interests.length - MAX_INTERESTS_DISPLAYED;

  const handleProfileUpdate = async (data: Partial<UserProfile>) => {
    // In a real app, you'd send this data to your backend
    console.log("Profile updated:", data);
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
    // Here you might re-fetch user data or update local state if `user` was a state variable
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-8 shadow-xl overflow-visible bg-card rounded-xl">
        <CardHeader className="text-center items-center pt-12 pb-6 bg-card relative rounded-t-xl">
          <Avatar className="w-32 h-32 border-4 border-primary shadow-lg -mt-24">
            <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold mt-4 font-headline text-foreground">{user.name}</CardTitle>
          <CardDescription className="text-muted-foreground">{user.email}</CardDescription>
          <p className="text-foreground mt-2 text-center max-w-md">{user.bio}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <MapPinIcon className="mr-3 h-5 w-5 text-primary" />
              <span>{user.location}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="mr-3 h-5 w-5 text-primary" />
              <span>Member since {user.memberSince}</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interestsToDisplay.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-sm px-3 py-1 hover:bg-accent hover:text-accent-foreground cursor-default">
                  {interest}
                </Badge>
              ))}
              {remainingInterestsCount > 0 && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  +{remainingInterestsCount} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* "Create New Trip" button removed from here */}

      <Tabs defaultValue="profile-details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1 rounded-lg shadow-sm">
          {/* "My Trips" TabTrigger removed */}
          <TabsTrigger value="profile-details" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">Edit Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">Preferences</TabsTrigger>
        </TabsList>
        
        {/* "My Trips" TabsContent removed */}

        <TabsContent value="profile-details">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold font-headline text-primary">Edit Your Profile</CardTitle>
                <CardDescription>Update your personal information below.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProfileEditForm initialData={user} onSubmit={handleProfileUpdate} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences">
          <Card className="shadow-lg rounded-xl">
             <CardHeader>
                <CardTitle className="text-2xl font-semibold font-headline text-primary">Travel Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">User travel preferences and settings will be managed here, such as preferred budget, travel style (e.g., adventure, relaxation), and accessibility needs. (Coming soon)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
