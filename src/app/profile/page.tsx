
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_USER_PROFILE } from "@/types";
import { CalendarDays, MapPinIcon, PlusCircle } from "lucide-react";
import Link from "next/link";

const MAX_INTERESTS_DISPLAYED = 6;

export default function ProfilePage() {
  const user = MOCK_USER_PROFILE; // In a real app, fetch this data

  const interestsToDisplay = user.interests.slice(0, MAX_INTERESTS_DISPLAYED);
  const remainingInterestsCount = user.interests.length - MAX_INTERESTS_DISPLAYED;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-8 shadow-xl overflow-visible">
        <CardHeader className="text-center items-center pt-8 pb-4 bg-card relative">
          <Avatar className="w-32 h-32 border-4 border-primary shadow-lg -mt-20">
            <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold mt-4 font-headline">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-foreground mt-1">{user.bio}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center text-muted-foreground">
            <MapPinIcon className="mr-3 h-5 w-5 text-primary" />
            <span>{user.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="mr-3 h-5 w-5 text-primary" />
            <span>Member since {user.memberSince}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interestsToDisplay.map((interest) => (
                <Badge key={interest} variant="default" className="text-sm px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {interest}
                </Badge>
              ))}
              {remainingInterestsCount > 0 && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  +{remainingInterestsCount} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="my-trips" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted p-1 rounded-lg">
          <TabsTrigger value="my-trips" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">My Trips</TabsTrigger>
          <TabsTrigger value="profile-details" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">Preferences</TabsTrigger>
        </TabsList>
        
        <div className="my-6">
          <Link href="/trips/new" className="w-full">
            <Button size="lg" className="w-full py-3 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                Create New Trip
            </Button>
          </Link>
        </div>

        <TabsContent value="my-trips">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold font-headline text-primary">Your Trips</h2>
            </CardHeader>
            <CardContent className="text-center py-10">
              <p className="text-xl text-muted-foreground mb-4">No trips yet. Create your first trip!</p>
              <Link href="/trips/new">
                <Button size="lg" variant="default">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Start Your First Trip
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="profile-details">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Detailed profile information and editing options will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">User travel preferences and settings will be managed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
