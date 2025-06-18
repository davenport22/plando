import type { Itinerary } from '@/types';
import { ItineraryDayCard } from './ItineraryDayCard';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ItineraryDisplayProps {
  itinerary: Itinerary | null;
}

export function ItineraryDisplay({ itinerary }: ItineraryDisplayProps) {
  if (!itinerary || itinerary.days.length === 0) {
    return (
      <Alert variant="default" className="mt-6 bg-blue-50 border-blue-200 text-blue-700">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <AlertTitle className="font-semibold">No Itinerary Generated Yet</AlertTitle>
        <AlertDescription>
          Once you've voted on activities, click the "Generate Itinerary" button to see your personalized trip plan here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-3xl font-headline font-semibold mb-6 text-primary">Your Trip Itinerary</h2>
      {itinerary.days.map((dayData) => (
        <ItineraryDayCard key={dayData.date} dayData={dayData} />
      ))}
    </div>
  );
}
