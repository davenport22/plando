
"use client";

import type { CompletedActivity } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPinIcon, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from 'date-fns';

interface CompletedActivityCardProps {
  activity: CompletedActivity;
  onCardClick: (activity: CompletedActivity) => void;
}

export function CompletedActivityCard({ activity, onCardClick }: CompletedActivityCardProps) {
  const displayImageUrl = activity.imageUrls && activity.imageUrls.length > 0 
    ? activity.imageUrls[0] 
    : "https://placehold.co/400x250.png";

  const imageHint = activity.dataAiHint || activity.name.toLowerCase().split(" ").slice(0,2).join(" ") || "activity";

  let formattedCompletedDate = "Recently";
  try {
    formattedCompletedDate = format(parseISO(activity.completedDate), "PP");
  } catch (e) {
    // Keep default if parsing fails
  }

  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg flex flex-col h-full group cursor-pointer"
      onClick={() => onCardClick(activity)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(activity)}}
      role="button"
      tabIndex={0}
      aria-label={`View details for completed activity: ${activity.name}`}
    >
        <CardHeader className="p-0 relative">
          <Image
            src={displayImageUrl}
            alt={activity.name}
            width={400}
            height={200}
            className="object-cover w-full h-40"
            data-ai-hint={imageHint}
          />
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
          </div>
        </CardContent>
      <CardFooter className="p-3 border-t bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300">
        <div className="flex items-center text-xs font-medium w-full">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            <span>Done on {formattedCompletedDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
