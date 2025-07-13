
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Activity, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getVotedOnCouplesActivityIds, getCustomCouplesActivities, getCustomFriendActivities, getCustomMeetActivities } from '@/lib/actions';

type ActivityModuleType = 'friends' | 'meet' | 'couples';

export function useLocalActivities(
    moduleType: ActivityModuleType, 
    userProfile: UserProfile | null,
    partnerProfile?: UserProfile | null
) {
    const { toast } = useToast();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
    const [currentLocationKey, setCurrentLocationKey] = useState<string>("Vienna, Austria");
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
        switch(moduleType) {
            case 'couples':
                allActivitiesForLocation = await getCustomCouplesActivities(determinedLocationKey);
                break;
            case 'friends':
                allActivitiesForLocation = await getCustomFriendActivities(determinedLocationKey);
                break;
            case 'meet':
                allActivitiesForLocation = await getCustomMeetActivities(determinedLocationKey);
                break;
        }
        
        const previouslyVotedIds = moduleType === 'couples' 
            ? new Set(await getVotedOnCouplesActivityIds(userProfile.id))
            : new Set<string>();

        const activitiesToShow = allActivitiesForLocation
                                  .filter(act => !previouslyVotedIds.has(act.id))
                                  .map(act => ({ ...act, isLiked: undefined }));
        
        setActivities(activitiesToShow);
        setVotedActivityIds(previouslyVotedIds);
        setIsLoading(false);
        
        if (activitiesToShow.length === 0 && allActivitiesForLocation.length > 0) {
             toast({ 
                title: "All Activities Voted On", 
                description: `You've already seen all available activities for ${determinedLocationKey}!`,
            });
        }

    }, [moduleType, toast, userProfile]);
    
    useEffect(() => {
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
