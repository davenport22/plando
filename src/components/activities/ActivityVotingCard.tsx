
"use client";

import type { Activity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPinIcon } from "lucide-react";
import Image from "next/image";
import React, { useState, useRef } from 'react';

interface ActivityVotingCardProps {
  activity: Activity;
  onVote: (activityId: string, liked: boolean) => void;
  onCardClick?: (activity: Activity) => void; 
}

const SWIPE_THRESHOLD = 100; // Min distance in px to trigger a vote
const CLICK_TAP_THRESHOLD = 10; // Max distance for a movement to be considered a click/tap
const ROTATION_FACTOR = 0.1; // How much the card rotates based on swipe distance
const FEEDBACK_OPACITY_FACTOR = 1.5; // How quickly feedback text becomes opaque

export function ActivityVotingCard({ activity, onVote, onCardClick }: ActivityVotingCardProps) {
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    offsetX: 0,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      cardRef.current.setPointerCapture(event.pointerId);
      setDragState({
        isDragging: true,
        startX: event.clientX,
        offsetX: 0,
      });
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    const currentX = event.clientX;
    setDragState(prev => ({
      ...prev,
      offsetX: currentX - prev.startX,
    }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    if (cardRef.current) {
      cardRef.current.releasePointerCapture(event.pointerId);
    }

    const movedDistance = Math.abs(dragState.offsetX);

    if (movedDistance > SWIPE_THRESHOLD) {
      onVote(activity.id, dragState.offsetX > 0);
    } else if (movedDistance <= CLICK_TAP_THRESHOLD && onCardClick) {
      onCardClick(activity);
    }


    setDragState({
      isDragging: false,
      startX: 0,
      offsetX: 0,
    });
  };
  
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.isDragging) {
        handlePointerUp(event);
    }
  };

  const rotation = dragState.offsetX * ROTATION_FACTOR;
  const cardStyle: React.CSSProperties = {
    transform: `translateX(${dragState.offsetX}px) rotate(${rotation}deg)`,
    transition: dragState.isDragging ? 'none' : 'transform 0.3s ease-out',
    cursor: dragState.isDragging ? 'grabbing' : 'grab',
    userSelect: dragState.isDragging ? 'none' : 'auto',
    touchAction: 'none', 
    position: 'relative', 
  };

  const getFeedbackOpacity = (direction: 'like' | 'nope') => {
    if (!dragState.isDragging) return 0;
    if (direction === 'like' && dragState.offsetX > 10) {
      return Math.min(1, (dragState.offsetX / SWIPE_THRESHOLD) * FEEDBACK_OPACITY_FACTOR);
    }
    if (direction === 'nope' && dragState.offsetX < -10) {
      return Math.min(1, (Math.abs(dragState.offsetX) / SWIPE_THRESHOLD) * FEEDBACK_OPACITY_FACTOR);
    }
    return 0;
  };

  let imageHint = "activity travel"; 
  const activityNameLower = activity.name.toLowerCase();

  if (activityNameLower.includes("eiffel")) imageHint = "eiffel tower";
  else if (activityNameLower.includes("louvre")) imageHint = "louvre museum";
  else if (activityNameLower.includes("seine")) imageHint = "seine river";
  else if (activityNameLower.includes("montmartre")) imageHint = "montmartre paris";
  else if (activityNameLower.includes("shibuya")) imageHint = "shibuya crossing";
  else if (activityNameLower.includes("senso-ji")) imageHint = "sensoji temple";
  else if (activityNameLower.includes("skytree")) imageHint = "tokyo skytree";
  else if (activityNameLower.includes("tsukiji")) imageHint = "tsukiji market";

  const displayImageUrl = activity.imageUrls && activity.imageUrls.length > 0 
    ? activity.imageUrls[0] 
    : "https://placehold.co/400x250.png";

  return (
    <Card 
      ref={cardRef}
      className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg flex flex-col h-full"
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="absolute top-1/2 left-4 transform -translate-y-1/2 -rotate-12 border-2 border-red-500 text-red-500 text-2xl font-bold px-4 py-2 rounded-md opacity-0"
        style={{ opacity: getFeedbackOpacity('nope'), zIndex: 1 }}
      >
        NOPE
      </div>
      <div
        className="absolute top-1/2 right-4 transform -translate-y-1/2 rotate-12 border-2 border-green-500 text-green-500 text-2xl font-bold px-4 py-2 rounded-md opacity-0"
        style={{ opacity: getFeedbackOpacity('like'), zIndex: 1 }}
      >
        LIKE
      </div>

      <CardHeader className="p-0 relative">
        <Image
          src={displayImageUrl}
          alt={activity.name}
          width={400}
          height={250}
          className="object-cover w-full h-48 pointer-events-none" 
          draggable="false"
          data-ai-hint={imageHint}
          priority // Preload the first visible image
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow pointer-events-none"> 
        <CardTitle className="text-xl font-headline mb-1">{activity.name}</CardTitle>
        {activity.description && <CardDescription className="text-sm mb-2 text-muted-foreground line-clamp-2">{activity.description.split('.')[0] + '.'}</CardDescription>}
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
    </Card>
  );
}

