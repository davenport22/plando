
"use client"; 

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_USER_PROFILE } from "@/types"; 
import { CalendarDays, MapPinIcon } from "lucide-react";

const MAX_INTERESTS_DISPLAYED = 6;

export default function ProfilePage() {
  const user = MOCK_USER_PROFILE; 

  const interestsToDisplay = user.interests.slice(0, MAX_INTERESTS_DISPLAYED);
  const remainingInterestsCount = user.interests.length - MAX_INTERESTS_DISPLAYED;

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
    </div>
  );
}
