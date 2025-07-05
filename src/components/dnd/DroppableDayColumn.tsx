
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import { DraggableActivityCard } from "./DraggableActivityCard";
import type { ItineraryDay, Activity } from '@/types';
import { cn } from "@/lib/utils";

interface DroppableDayColumnProps {
  dayData: ItineraryDay;
  onActivityClick: (activity: Activity) => void;
}

export function DroppableDayColumn({ dayData, onActivityClick }: DroppableDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dayData.date,
  });

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEEE, MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <SortableContext items={dayData.activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
      <Card ref={setNodeRef} className={cn("mb-6 shadow-lg rounded-lg transition-colors", isOver && "bg-accent/20")}>
        <CardHeader className="bg-primary/10 rounded-t-lg">
          <CardTitle className="text-2xl font-headline text-primary">{formatDate(dayData.date)}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {dayData.activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">
              <p>Drop activities here</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {dayData.activities.map((activity) => (
                <DraggableActivityCard
                  key={activity.id}
                  activity={activity}
                  onActivityClick={onActivityClick}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </SortableContext>
  );
}
