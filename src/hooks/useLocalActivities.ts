
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Activity, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getCustomCouplesActivities, getVotedOnCouplesActivityIds, getCustomFriendActivities, getCustomMeetActivities } from '@/lib/actions';

type ActivityModuleType = 'friends' | 'meet' | 'couples';

export function useLocalActivities(
    moduleType: ActivityModuleType, 
    userProfile: UserProfile | null,
    connectedProfile?: UserProfile | null // Can be partner or friend
) {
    const { toast } = useToast();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
    const [currentLocationKey, setCurrentLocationKey] = useState<string>("");
    const [votedActivityIds, setVotedActivityIds] = useState<Set<string>>(new Set());

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        setActivities([]);
        
        if (!userProfile) {
            setIsLoading(false);
            return;
        }

        const determinedLocationKey = userProfile.location || "Vienna, Austria";
        const statusMsg = userProfile.location
            ? `Using your profile location for activities: ${determinedLocationKey}.`
            : "No profile location set. Using default activities from Vienna.";

        setCurrentLocationKey(determinedLocationKey);
        setLocationStatusMessage(statusMsg);
        
        let allActivitiesForLocation: Activity[] = [];
        let previouslyVotedIds = new Set<string>();

        switch(moduleType) {
            case 'couples':
                [allActivitiesForLocation, previouslyVotedIds] = await Promise.all([
                    getCustomCouplesActivities(determinedLocationKey, userProfile.id, connectedProfile?.id),
                    getVotedOnCouplesActivityIds(userProfile.id).then(ids => new Set(ids))
                ]);
                break;
            case 'friends':
                allActivitiesForLocation = await getCustomFriendActivities(determinedLocationKey, userProfile.id, connectedProfile?.id);
                // For now, friends module doesn't track votes in the same way, so we show all.
                break;
            case 'meet':
                allActivitiesForLocation = await getCustomMeetActivities(determinedLocationKey, userProfile.id);
                 // Meet module might have a different voting system, for now we don't filter
                break;
        }
        
        const activitiesToShow = allActivitiesForLocation
                                  .filter(act => !previouslyVotedIds.has(act.id))
                                  .map(act => ({ ...act, isLiked: undefined }));
        
        setActivities(activitiesToShow);
        setVotedActivityIds(previouslyVotedIds);
        setIsLoading(false);
        
        if (moduleType === 'couples' && activitiesToShow.length === 0 && allActivitiesForLocation.length > 0) {
             toast({ 
                title: "All Activities Voted On", 
                description: `You've already seen all available activities for ${determinedLocationKey}!`,
            });
        }

    }, [moduleType, toast, userProfile, connectedProfile]);
    
    useEffect(() => {
        // This effect ensures fetchActivities is only called when userProfile is definitively loaded.
        if (userProfile !== undefined) {
            fetchActivities();
        }
    }, [fetchActivities, userProfile]);

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
