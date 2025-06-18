
"use client";

import type { Activity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPinIcon } from "lucide-react";
import Image from "next/image";
import React, { useState, useRef } from 'react';

interface ActivityVotingCardProps {
  activity: Activity;
  onVote: (activityId: string, liked: boolean) => void;
}

const SWIPE_THRESHOLD = 100; // Min distance in px to trigger a vote
const ROTATION_FACTOR = 0.1; // How much the card rotates based on swipe distance
const FEEDBACK_OPACITY_FACTOR = 1.5; // How quickly feedback text becomes opaque

export function ActivityVotingCard({ activity, onVote }: ActivityVotingCardProps) {
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

    if (Math.abs(dragState.offsetX) > SWIPE_THRESHOLD) {
      onVote(activity.id, dragState.offsetX > 0);
      // Card will likely be removed by parent, so no need to animate it out here for now
    }

    setDragState({
      isDragging: false,
      startX: 0,
      offsetX: 0,
    });
  };
  
  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.isDragging) {
        // If pointer leaves while dragging (e.g. mouse out of window), treat as drag end.
        handlePointerUp(event);
    }
  };

  const rotation = dragState.offsetX * ROTATION_FACTOR;
  const cardStyle: React.CSSProperties = {
    transform: `translateX(${dragState.offsetX}px) rotate(${rotation}deg)`,
    transition: dragState.isDragging ? 'none' : 'transform 0.3s ease-out',
    cursor: dragState.isDragging ? 'grabbing' : 'grab',
    userSelect: dragState.isDragging ? 'none' : 'auto',
    touchAction: 'none', // Prevents scrolling while swiping card
    position: 'relative', // For absolute positioned feedback
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

  return (
    <Card 
      ref={cardRef}
      className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg flex flex-col h-full"
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave} // Handle mouse leaving the card area
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
          src={activity.imageUrl || "https://placehold.co/400x250.png"}
          alt={activity.name}
          width={400}
          height={250}
          className="object-cover w-full h-48 pointer-events-none" // Prevent image drag
          draggable="false"
          data-ai-hint="activity travel"
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow pointer-events-none"> {/* Prevent text selection */}
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
      {/* Footer with buttons removed */}
    </Card>
  );
}
