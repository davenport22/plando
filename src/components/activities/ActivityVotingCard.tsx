"use client";

import type { Activity } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsDown, ThumbsUp, Zap, Clock, MapPinIcon } from "lucide-react";
import Image from "next/image";
import { useState } from 'react';

interface ActivityVotingCardProps {
  activity: Activity;
  onVote: (activityId: string, liked: boolean) => void;
}

export function ActivityVotingCard({ activity, onVote }: ActivityVotingCardProps) {
  const [vote, setVote] = useState<'liked' | 'disliked' | null>(null);

  const handleVote = (liked: boolean) => {
    const newVote = liked ? 'liked' : 'disliked';
    // Allow unvoting or changing vote
    if (vote === newVote) {
      setVote(null);
      onVote(activity.id, false); // Or a specific "unvote" action
    } else {
      setVote(newVote);
      onVote(activity.id, liked);
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <Image
          src={activity.imageUrl || "https://placehold.co/400x250.png"}
          alt={activity.name}
          width={400}
          height={250}
          className="object-cover w-full h-48"
          data-ai-hint="activity travel"
        />
        {/* Display vote count/popularity if available */}
        {/* <Badge variant="secondary" className="absolute top-2 right-2">Popularity: 75%</Badge> */}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-headline mb-1">{activity.name}</CardTitle>
        {activity.description && <CardDescription className="text-sm mb-2 text-muted-foreground">{activity.description}</CardDescription>}
        <div className="space-y-1 text-sm">
          <div className="flex items-center text-muted-foreground">
            <MapPinIcon className="mr-2 h-4 w-4 text-primary" />
            <span>{activity.location}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <span>{activity.duration} hours</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 flex justify-around">
        <Button
          variant={vote === 'disliked' ? 'destructive' : 'outline'}
          size="lg"
          onClick={() => handleVote(false)}
          className="flex-1 mr-2 transition-all duration-150 ease-in-out transform hover:scale-105"
          aria-pressed={vote === 'disliked'}
        >
          <ThumbsDown className="mr-2 h-5 w-5" /> Dislike
        </Button>
        <Button
          variant={vote === 'liked' ? 'default' : 'outline'}
          size="lg"
          onClick={() => handleVote(true)}
          className={`flex-1 ml-2 transition-all duration-150 ease-in-out transform hover:scale-105 ${vote === 'liked' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
          aria-pressed={vote === 'liked'}
        >
          <ThumbsUp className="mr-2 h-5 w-5" /> Like
        </Button>
      </CardFooter>
    </Card>
  );
}
