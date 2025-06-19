
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ALL_MOCK_USERS, type UserProfile } from "@/types"; 
import { CalendarDays, MapPinIcon, ArrowLeft, UserCircle, Loader2 } from "lucide-react";
import Link from 'next/link'; // Not strictly needed if only using router.back() but good for completeness

export default function UserProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const userToView = ALL_MOCK_USERS.find(u => u.id === userId);
    if (userToView) {
      setViewedUser(userToView);
    } else {
      // Handle user not found, e.g., redirect or show error
      // For now, we'll just leave viewedUser as null
      console.warn(`User with ID ${userId} not found in ALL_MOCK_USERS.`);
    }
    setIsLoading(false);
  }, [userId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading user profile...</p>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="text-center py-10">
          <CardHeader>
            <UserCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              The profile you are trying to view does not exist or could not be loaded.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
       <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Card className="mb-8 shadow-xl overflow-visible bg-card rounded-xl">
        <CardHeader className="text-center items-center pt-12 pb-6 bg-card relative rounded-t-xl">
          <Avatar className="w-32 h-32 border-4 border-primary shadow-lg -mt-16">
            <AvatarImage src={viewedUser.avatarUrl || `https://avatar.vercel.sh/${viewedUser.email}.png`} alt={viewedUser.name} />
            <AvatarFallback>{viewedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold mt-4 font-headline text-foreground">{viewedUser.name}</CardTitle>
          <CardDescription className="text-muted-foreground">{viewedUser.email}</CardDescription>
          {viewedUser.bio && <p className="text-foreground mt-2 text-center max-w-md">{viewedUser.bio}</p>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {viewedUser.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="mr-3 h-5 w-5 text-primary" />
                <span>{viewedUser.location}</span>
              </div>
            )}
            {viewedUser.memberSince && (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                <span>Member since {viewedUser.memberSince}</span>
              </div>
            )}
          </div>
          
          {viewedUser.interests && viewedUser.interests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {viewedUser.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-sm px-3 py-1 hover:bg-accent hover:text-accent-foreground cursor-default">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {/* This section is intentionally omitted as it's for the logged-in user's completed trips
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Completed Trips</h3>
             ... 
          </div> 
          */}
        </CardContent>
      </Card>
    </div>
  );
}
