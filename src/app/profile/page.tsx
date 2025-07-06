
"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Trip, type UserProfile } from "@/types"; 
import { CalendarDays, MapPinIcon, CheckCircle2, Edit, AlertCircle, Loader2 } from "lucide-react";
import Link from 'next/link';
import { getCompletedTripsForUser } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    // If we have a user, fetch their data
    if (user) {
      const loadData = async () => {
        setDataLoading(true);
        const trips = await getCompletedTripsForUser(user.uid);
        setCompletedTrips(trips);
        setDataLoading(false);
      };
      loadData();
    }
  }, [user, authLoading, router]);

  if (authLoading || dataLoading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            Could not load your user profile from the database. This is often due to a server configuration issue. Please ensure your backend Firebase credentials (service account) are set correctly in your `.env` file as described in the README.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-8 shadow-xl overflow-visible bg-card rounded-xl">
        <CardHeader className="text-center items-center pt-12 pb-6 bg-card relative rounded-t-xl">
          <Avatar className="w-32 h-32 border-4 border-primary shadow-lg -mt-16">
            <AvatarImage src={userProfile.avatarUrl || `https://avatar.vercel.sh/${userProfile.email}.png`} alt={userProfile.name} />
            <AvatarFallback>{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold mt-4 font-headline text-foreground">{userProfile.name}</CardTitle>
          <CardDescription className="text-muted-foreground">{userProfile.email}</CardDescription>
          {userProfile.bio && <p className="text-foreground mt-2 text-center max-w-md">{userProfile.bio}</p>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-end mb-4">
            <Button asChild variant="outline">
              <Link href="/profile/edit">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {userProfile.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="mr-3 h-5 w-5 text-primary" />
                <span>{userProfile.location}</span>
              </div>
            )}
            {userProfile.memberSince && (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                <span>Member since {userProfile.memberSince}</span>
              </div>
            )}
          </div>
          
          {userProfile.interests && userProfile.interests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userProfile.interests.map((interest) => (
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
