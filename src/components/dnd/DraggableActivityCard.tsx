
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Activity } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Clock, GripVertical, Info, MapPin, ThumbsDown, ThumbsUp } from "lucide-react";

interface DraggableActivityCardProps {
  activity: Activity;
  onActivityClick: (activity: Activity) => void;
}

const categoryVariantMap: Record<string, "default" | "secondary" | "outline" | "destructive" | null | undefined> = {
  'Must Do': 'default',
  'Recommended': 'secondary',
  'Optional': 'outline'
};

export function DraggableActivityCard({ activity, onActivityClick }: DraggableActivityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="p-4 border rounded-md bg-card hover:shadow-md transition-shadow flex items-start group cursor-pointer touch-none"
      onClick={() => onActivityClick(activity)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onActivityClick(activity)}}
      aria-label={`View details for ${activity.name}`}
    >
      <button {...attributes} {...listeners} className="p-1 -ml-1 mr-2 mt-1 focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:text-foreground" aria-label="Drag to reorder"/>
      </button>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-lg font-semibold">{activity.name}</h4>
          <div className="flex items-center gap-2">
            {activity.category && (
              <Badge variant={categoryVariantMap[activity.category] || 'secondary'} className="ml-2 whitespace-nowrap">
                {activity.category}
              </Badge>
            )}
            <Info className="h-4 w-4 text-primary/70 group-hover:text-primary" title="View details"/>
          </div>
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
          {activity.description && <p className="pt-1 text-xs italic line-clamp-2">{activity.description}</p>}
          {(activity.likes !== undefined && activity.likes > 0) || (activity.dislikes !== undefined && activity.dislikes > 0) ? (
            <div className="flex items-center pt-2 gap-4">
              {activity.likes !== undefined && activity.likes > 0 && (
                <div className="flex items-center text-green-600">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span>{activity.likes}</span>
                </div>
              )}
              {activity.dislikes !== undefined && activity.dislikes > 0 && (
                <div className="flex items-center text-red-600">
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  <span>{activity.dislikes}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
