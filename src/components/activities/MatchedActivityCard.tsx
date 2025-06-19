
"use client";

import type { MatchedActivity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPinIcon, CalendarCheck2, Sparkles, Info, HeartCrack } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from 'date-fns';

interface MatchedActivityCardProps {
  activity: MatchedActivity;
  onCardClick: (activity: MatchedActivity) => void;
}

export function MatchedActivityCard({ activity, onCardClick }: MatchedActivityCardProps) {
  const displayImageUrl = activity.imageUrls && activity.imageUrls.length > 0 
    ? activity.imageUrls[0] 
    : "https://placehold.co/400x250.png";

  const imageHint = activity.dataAiHint || activity.name.toLowerCase().split(" ").slice(0,2).join(" ") || "activity";

  let formattedMatchedDate = "Recently";
  try {
    formattedMatchedDate = format(parseISO(activity.matchedDate), "PP");
  } catch (e) {
    // Keep default if parsing fails
  }

  const PartnerIcon = activity.partnerAlsoLiked ? Sparkles : HeartCrack;
  const partnerIconColor = activity.partnerAlsoLiked ? "text-primary-foreground" : "text-destructive-foreground";
  const partnerIconBg = activity.partnerAlsoLiked ? "bg-primary/80" : "bg-destructive/80";


  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg flex flex-col h-full cursor-pointer group"
      onClick={() => onCardClick(activity)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick(activity)}}
      role="button"
      tabIndex={0}
      aria-label={`View details for matched activity: ${activity.name}`}
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
        <div className={`absolute top-2 right-2 ${partnerIconBg} ${partnerIconColor} p-2 rounded-md backdrop-blur-sm`}>
            <PartnerIcon className="h-5 w-5" />
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
      <div className="p-3 border-t bg-muted/30 text-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <Info className="inline h-3 w-3 mr-1" /> Click to see details
      </div>
    </Card>
  );
}
