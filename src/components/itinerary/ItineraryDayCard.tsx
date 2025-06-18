
import type { ItineraryDay } from '@/types'; // Activity type is implicitly used via ItineraryDay
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, ThumbsUp, ThumbsDown, GripVertical } from "lucide-react";
import { format, parseISO } from 'date-fns';

interface ItineraryDayCardProps {
  dayData: ItineraryDay;
}

const categoryVariantMap: Record<string, "default" | "secondary" | "outline" | "destructive" | null | undefined> = {
  'Must Do': 'default',
  'Recommended': 'secondary',
  'Optional': 'outline'
};

export function ItineraryDayCard({ dayData }: ItineraryDayCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEEE, MMMM d, yyyy");
    } catch (error) {
      try {
        return format(new Date(dateString + 'T00:00:00'), "EEEE, MMMM d, yyyy");
      } catch (e) {
        return dateString; // fallback
      }
    }
  };
  
  return (
    <Card className="mb-6 shadow-lg rounded-lg">
      <CardHeader className="bg-primary/10 rounded-t-lg">
        <CardTitle className="text-2xl font-headline text-primary">{formatDate(dayData.date)}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {dayData.activities.length === 0 ? (
          <p className="text-muted-foreground">No activities scheduled for this day.</p>
        ) : (
          <ul className="space-y-4">
            {dayData.activities.map((activity, index) => (
              <li key={activity.id || index} className="p-4 border rounded-md bg-card hover:shadow-md transition-shadow flex items-start group">
                <GripVertical className="h-5 w-5 text-muted-foreground mr-3 mt-1 flex-shrink-0 hidden group-hover:block cursor-grab" aria-label="Drag to reorder"/>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-lg font-semibold">{activity.name}</h4>
                    {activity.category && (
                      <Badge variant={categoryVariantMap[activity.category] || 'secondary'} className="ml-2 whitespace-nowrap">
                        {activity.category}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {activity.startTime && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-accent" />
                        <span>{activity.startTime} (approx. {activity.duration} hrs)</span>
                      </div>
                    )}
                    {!activity.startTime && (
                       <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-accent" />
                        <span>Duration: {activity.duration} hrs</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-accent" />
                      <span>{activity.location}</span>
                    </div>
                     {activity.description && <p className="pt-1 text-xs italic">{activity.description}</p>}
                    {(activity.likes !== undefined || activity.dislikes !== undefined) && (
                      <div className="flex items-center pt-1 gap-4">
                        <div className="flex items-center text-green-600">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          <span>{activity.likes ?? 0}</span>
                        </div>
                        <div className="flex items-center text-red-600">
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          <span>{activity.dislikes ?? 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
