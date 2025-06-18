import type { Trip } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={trip.imageUrl || "https://placehold.co/600x400.png"}
            alt={trip.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="travel landscape"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-2xl font-headline mb-2">{trip.name}</CardTitle>
        <CardDescription className="flex items-center text-muted-foreground mb-1">
          <MapPin className="mr-2 h-4 w-4 text-primary" /> {trip.destination}
        </CardDescription>
        <div className="flex items-center text-sm text-muted-foreground mb-1">
          <CalendarDays className="mr-2 h-4 w-4 text-primary" /> {trip.startDate} - {trip.endDate}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4 text-primary" /> {trip.participantIds.length} participant(s)
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-muted/30">
        <Link href={`/trips/${trip.id}`} passHref legacyBehavior>
          <Button className="w-full" aria-label={`View details for ${trip.name}`}>
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
