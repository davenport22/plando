
"use client"; 

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_USER_PROFILE, MOCK_TRIPS, type Trip, type UserProfile } from "@/types"; 
import { CalendarDays, MapPinIcon, CheckCircle2, Edit } from "lucide-react";
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>(MOCK_USER_PROFILE); 
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const filteredTrips = MOCK_TRIPS.filter(trip => {
      const endDate = new Date(trip.endDate);
      return endDate < today;
    });
    setCompletedTrips(filteredTrips);
  }, []);


  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-8 shadow-xl overflow-visible bg-card rounded-xl">
        <CardHeader className="text-center items-center pt-12 pb-6 bg-card relative rounded-t-xl">
          <Avatar className="w-32 h-32 border-4 border-primary shadow-lg -mt-16">
            <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold mt-4 font-headline text-foreground">{user.name}</CardTitle>
          <CardDescription className="text-muted-foreground">{user.email}</CardDescription>
          {user.bio && <p className="text-foreground mt-2 text-center max-w-md">{user.bio}</p>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-end mb-4">
            <Link href="/profile/edit" passHref>
              <Button variant="outline" asChild>
                <a>
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </a>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {user.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="mr-3 h-5 w-5 text-primary" />
                <span>{user.location}</span>
              </div>
            )}
            {user.memberSince && (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                <span>Member since {user.memberSince}</span>
              </div>
            )}
          </div>
          
          {user.interests && user.interests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-sm px-3 py-1 hover:bg-accent hover:text-accent-foreground cursor-default">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Completed Trips</h3>
            {completedTrips.length > 0 ? (
              <ul className="space-y-3">
                {completedTrips.map(trip => (
                  <li key={trip.id} className="p-4 border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-1">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="font-semibold text-md text-foreground">{trip.name}</span>
                    </div>
                    <div className="pl-7">
                      <p className="text-sm text-muted-foreground">{trip.destination}</p>
                      <p className="text-xs text-muted-foreground">{trip.startDate} to {trip.endDate}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No completed trips yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
