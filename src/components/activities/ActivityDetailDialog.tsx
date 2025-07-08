
"use client";

import { useState, useEffect } from 'react';
import type { Activity } from '@/types';
import type { GenerateActivityDescriptionOutput } from '@/ai/flows/generate-activity-description-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Clock, ThumbsUp, ThumbsDown, Info, CalendarDays, Tag, Loader2, DollarSign, Sunrise } from "lucide-react";
import { Badge } from '../ui/badge';
import { enhanceActivityDescriptionAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface ActivityDetailDialogProps {
  activity: Activity | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const categoryVariantMap: Record<string, "default" | "secondary" | "outline" | "destructive" | null | undefined> = {
  'Must Do': 'default',
  'Recommended': 'secondary',
  'Optional': 'outline'
};

export function ActivityDetailDialog({ activity, isOpen, onOpenChange }: ActivityDetailDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enhancedActivityDetails, setEnhancedActivityDetails] = useState<GenerateActivityDescriptionOutput | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (activity) {
      setCurrentImageIndex(0);
      setEnhancedActivityDetails(null); 

      if (isOpen) {
        setIsLoadingDetails(true);
        enhanceActivityDescriptionAction(activity.name, activity.location)
          .then(result => {
            if ('description' in result) { // Check if it's the success type
              setEnhancedActivityDetails(result);
            } else if ('error' in result) {
              console.warn("Failed to enhance activity details:", result.error);
              // Optionally show a toast, but we'll fallback to original description anyway
            }
          })
          .catch(error => {
            console.error("Error fetching enhanced activity details:", error);
            // toast({ title: "Error", description: "Could not fetch enhanced activity details.", variant: "destructive" });
          })
          .finally(() => {
            setIsLoadingDetails(false);
          });
      }
    }
  }, [activity, isOpen, toast]);

  if (!activity) {
    return null;
  }

  const { name, description: originalDescription, location, duration, imageUrls, category, startTime, likes, dislikes } = activity;

  const displayDescription = enhancedActivityDetails?.description || originalDescription || "No description available.";

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % (imageUrls?.length || 1));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + (imageUrls?.length || 1)) % (imageUrls?.length || 1));
  };
  
  const imageHint = activity.dataAiHint || (name ? name.toLowerCase().split(" ").slice(0,2).join(" ") : "activity detail");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setEnhancedActivityDetails(null);
        setIsLoadingDetails(false);
      }
    }}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl md:text-3xl font-headline text-primary">{name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
          {imageUrls && imageUrls.length > 0 && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg">
              <Image
                src={imageUrls[currentImageIndex]}
                alt={`${name} - image ${currentImageIndex + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-opacity duration-300 ease-in-out"
                priority={currentImageIndex === 0}
                data-ai-hint={imageHint}
              />
              {imageUrls.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-10 w-10"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                    {imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2.5 w-2.5 rounded-full ${
                          index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                        } transition-all`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                About this activity
            </h3>
            {isLoadingDetails && !enhancedActivityDetails ? (
              <div className="flex items-center text-muted-foreground py-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading enhanced details...</span>
              </div>
            ) : (
              <p className="whitespace-pre-line text-muted-foreground prose prose-sm sm:prose-base max-w-none">{displayDescription}</p>
            )}
          </div>
           
          <div className="space-y-3 text-sm">
             <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                Key Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                <span>{enhancedActivityDetails?.address || location}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                <span>
                  {enhancedActivityDetails?.suggestedDurationHours 
                    ? `${enhancedActivityDetails.suggestedDurationHours} hours (suggested)` 
                    : `${duration} hours`}
                  {startTime && !enhancedActivityDetails?.suggestedDurationHours ? ` (Starts around ${startTime})` : ''}
                </span>
              </div>
              {enhancedActivityDetails?.bestTimeToVisit && (
                <div className="flex items-center text-muted-foreground">
                  <Sunrise className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                  <span>Best time to visit: {enhancedActivityDetails.bestTimeToVisit}</span>
                </div>
              )}
              {enhancedActivityDetails?.estimatedPriceRange && (
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                  <span>Price: {enhancedActivityDetails.estimatedPriceRange}</span>
                </div>
              )}
              {category && (
                  <div className="flex items-center text-muted-foreground">
                      <Tag className="mr-3 h-5 w-5 text-accent flex-shrink-0" />
                      Category: <Badge variant={categoryVariantMap[category] || 'secondary'} className="ml-2">{category}</Badge>
                  </div>
              )}
              {(likes > 0 || dislikes > 0) && (
                <div className="flex items-center pt-1 gap-6 sm:col-span-2">
                  {likes > 0 && (
                      <div className="flex items-center text-green-600">
                      <ThumbsUp className="mr-2 h-5 w-5" />
                      <span className="font-medium">{likes} Like{likes > 1 ? 's' : ''}</span>
                      </div>
                  )}
                  {dislikes > 0 && (
                      <div className="flex items-center text-red-600">
                      <ThumbsDown className="mr-2 h-5 w-5" />
                      <span className="font-medium">{dislikes} Dislike{dislikes > 1 ? 's' : ''}</span>
                      </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pt-4 flex-shrink-0">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
