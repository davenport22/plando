
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
    const [currentLocationKey, setCurrentLocationKey] = useState<string>("Default");
    const [votedActivityIds, setVotedActivityIds] = useState<Set<string>>(new Set());

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        
        let determinedLocationKey = userProfile?.location || "Default";
        let statusMsg: string;

        if (moduleType === 'couples' && userProfile && partnerProfile) {
            const primaryUser = userProfile.id < partnerProfile.id ? userProfile : partnerProfile;
            const secondaryUser = userProfile.id < partnerProfile.id ? partnerProfile : userProfile;
            determinedLocationKey = primaryUser.location || secondaryUser.location || "Default";
            statusMsg = `Viewing shared date ideas for ${determinedLocationKey}.`;
        } else {
             statusMsg = userProfile?.location
                ? `Using your profile location for activities: ${determinedLocationKey}.`
                : "No profile location set. Using default activities.";
        }

        setCurrentLocationKey(determinedLocationKey);
        setLocationStatusMessage(statusMsg);
        
        let previouslyVotedIds = new Set<string>();
        if (moduleType === 'couples' && userProfile) {
            const ids = await getVotedOnCouplesActivityIds(userProfile.id);
            previouslyVotedIds = new Set(ids);
            setVotedActivityIds(previouslyVotedIds);
        }

        let customActivities: Activity[] = [];
        switch(moduleType) {
            case 'couples':
                customActivities = await getCustomCouplesActivities(determinedLocationKey);
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
        
        if (activitiesToShow.length === 0 && previouslyVotedIds.size > 0) {
             toast({ 
                title: "All Activities Voted On", 
                description: "You've already seen all available activities for your area!",
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
