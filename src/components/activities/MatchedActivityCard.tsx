
"use client";

import type { MatchedActivity } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPinIcon, CalendarCheck2, Sparkles, CheckCircle } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from 'date-fns';
import { Button } from '../ui/button';

interface MatchedActivityCardProps {
  activity: MatchedActivity;
  onCardClick: (activity: MatchedActivity) => void;
  onMarkAsDone: (activity: MatchedActivity) => void;
}

export function MatchedActivityCard({ activity, onCardClick, onMarkAsDone }: MatchedActivityCardProps) {
  const imageHint = activity.dataAiHint || activity.name.toLowerCase().split(" ").slice(0,2).join(",") || "activity,date";

  let formattedMatchedDate = "Recently";
  try {
    formattedMatchedDate = format(parseISO(activity.matchedDate), "PP");
  } catch (e) {
    // Keep default if parsing fails
  }

  const MatchIcon = Sparkles;
  const matchIconColor = "text-primary-foreground";
  const matchIconBg = "bg-primary/80";


  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg flex flex-col h-full group"
    >
      <div 
        className="relative cursor-pointer flex-grow" 
        onClick={() => onCardClick(activity)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(activity)}}
        role="button"
        tabIndex={0}
        aria-label={`View details for matched activity: ${activity.name}`}
      >
        <CardHeader className="p-0 relative">
          <Image
            src={activity.imageUrls?.[0] || 'https://placehold.co/400x250.png'}
            alt={activity.name}
            width={400}
            height={200}
            className="object-cover w-full h-40"
            data-ai-hint={imageHint}
          />
          <div className={`absolute top-2 right-2 ${matchIconBg} ${matchIconColor} p-2 rounded-md backdrop-blur-sm`}>
              <MatchIcon className="h-5 w-5" title="It's a match!" />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-headline mb-1 group-hover:text-primary transition-colors">{activity.name}</CardTitle>
          {activity.description && <CardDescription className="text-xs mb-2 text-muted-foreground line-clamp-2">{activity.description.split('.')[0] + '.'}</CardDescription>}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <MapPinIcon className="mr-2 h-3 w-3 text-accent" />
              <span>{activity.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-3 w-3 text-accent" />
              <span>{activity.duration} hours</span>
            </div>
            <div className="flex items-center">
              <CalendarCheck2 className="mr-2 h-3 w-3 text-accent" />
              <span>You liked: {formattedMatchedDate}</span>
            </div>
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-3 border-t bg-muted/30">
        <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onMarkAsDone(activity)}
        >
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> We did this!
        </Button>
      </CardFooter>
    </Card>
  );
}

    