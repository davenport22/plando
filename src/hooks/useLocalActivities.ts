
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Activity } from '@/types';
import { 
    MOCK_USER_PROFILE, 
    MOCK_ACTIVITIES_BY_CITY, 
    MOCK_COUPLES_ACTIVITIES_BY_CITY 
} from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getLikedCouplesActivityIds } from '@/lib/actions';

type ActivityModuleType = 'friends' | 'meet' | 'couples';

export function useLocalActivities(moduleType: ActivityModuleType) {
    const { toast } = useToast();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
    const [currentLocationKey, setCurrentLocationKey] = useState<string>("Default");
    const [votedActivityIds, setVotedActivityIds] = useState<Set<string>>(new Set());

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        
        const determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
        const statusMsg = `Using profile location for activities: ${determinedLocationKey}.`;

        setCurrentLocationKey(determinedLocationKey);
        setLocationStatusMessage(statusMsg);

        const activitySource = moduleType === 'couples' 
            ? MOCK_COUPLES_ACTIVITIES_BY_CITY 
            : MOCK_ACTIVITIES_BY_CITY;
        
        let previouslyVotedIds = new Set<string>();
        if (moduleType === 'couples') {
            const ids = await getLikedCouplesActivityIds(MOCK_USER_PROFILE.id);
            previouslyVotedIds = new Set(ids);
            setVotedActivityIds(previouslyVotedIds);
        }

        const activitiesToShow = (activitySource[determinedLocationKey] || activitySource["Default"])
                                  .filter(act => !previouslyVotedIds.has(act.id))
                                  .map(act => ({ ...act, isLiked: undefined }));

        setActivities(activitiesToShow);
        setIsLoading(false);
        
        if (activitiesToShow.length === 0 && previouslyVotedIds.size > 0) {
             toast({ 
                title: "All Activities Voted On", 
                description: "You've already seen all available activities for your area!",
            });
        }

        return activitiesToShow;

    }, [moduleType, toast]);
    
    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return {
        activities,
        setActivities,
        isLoading,
        locationStatusMessage,
        currentLocationKey,
        fetchActivities,
        votedActivityIds,
        setVotedActivityIds
    };
}
