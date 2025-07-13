
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
        
        if (!userProfile) {
            setIsLoading(false);
            return [];
        }

        const determinedLocationKey = userProfile.location || "Vienna, Austria";
        const statusMsg = userProfile.location
            ? `Using your profile location for activities: ${determinedLocationKey}.`
            : "No profile location set. Using default activities from Vienna.";

        setCurrentLocationKey(determinedLocationKey);
        setLocationStatusMessage(statusMsg);
        
        let previouslyVotedIds = new Set<string>();
        if (moduleType === 'couples') {
            const ids = await getVotedOnCouplesActivityIds(userProfile.id);
            previouslyVotedIds = new Set(ids);
            setVotedActivityIds(previouslyVotedIds);
        }

        let customActivities: Activity[] = [];
        switch(moduleType) {
            case 'couples':
                customActivities = await getCustomCouplesActivities(determinedLocationKey, userProfile.id, partnerProfile?.id);
                break;
            case 'friends':
                customActivities = await getCustomFriendActivities(determinedLocationKey);
                break;
            case 'meet':
                customActivities = await getCustomMeetActivities(determinedLocationKey);
                break;
        }

        const activitiesToShow = customActivities
                                  .filter(act => !previouslyVotedIds.has(act.id))
                                  .map(act => ({ ...act, isLiked: undefined }));

        setActivities(activitiesToShow);
        setIsLoading(false);
        
        if (activitiesToShow.length === 0 && customActivities.length > 0) {
             toast({ 
                title: "All Activities Voted On", 
                description: `You've already seen all available activities for ${determinedLocationKey}!`,
            });
        }

        return activitiesToShow;

    }, [moduleType, toast, userProfile, partnerProfile]);
    
    useEffect(() => {
        if (userProfile !== undefined) { // To prevent fetching when auth is still loading
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
