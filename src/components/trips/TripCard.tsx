
import type { Trip } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { calculateTripDuration } from '@/lib/utils';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const imageHint = trip.destination.toLowerCase().split(',')[0].trim().replace(/\s+/g, ',') || "travel,landscape";

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={trip.imageUrl || 'https://images.unsplash.com/photo-1568736333610-eae6e0ab9206?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxhdXN0cmlhfGVufDB8fHx8MTc1MjYwODU2Nnww&ixlib=rb-4.1.0&q=80&w=1080'}
            alt={trip.name}
            fill
            className="object-cover"
            data-ai-hint={imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-2">{trip.name}</CardTitle>
        <CardDescription className="flex items-center text-muted-foreground mb-1">
          <MapPin className="mr-2 h-4 w-4 text-primary" /> {trip.destination}
        </CardDescription>
        <div className="flex items-center text-sm text-muted-foreground mb-1">
          <CalendarDays className="mr-2 h-4 w-4 text-primary" /> 
          {trip.startDate} - {trip.endDate} 
          {trip.startDate && trip.endDate && <span className="ml-1">({calculateTripDuration(trip.startDate, trip.endDate)})</span>}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4 text-primary" /> {trip.participantIds.length} participant(s)
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-muted/30">
        <Link href={`/trips/${trip.id}`}>
          <Button className="w-full" aria-label={`View details for ${trip.name}`}>
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
