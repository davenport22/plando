
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Activity } from '@/types';
import { 
    MOCK_USER_PROFILE, 
    MOCK_ACTIVITIES_BY_CITY, 
    MOCK_COUPLES_ACTIVITIES_BY_CITY 
} from '@/types';
import { useToast } from '@/hooks/use-toast';

type ActivityModuleType = 'friends' | 'meet' | 'couples';

export function useLocalActivities(moduleType: ActivityModuleType) {
    const { toast } = useToast();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
    const [currentLocationKey, setCurrentLocationKey] = useState<string>("Default");

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        setLocationStatusMessage(`Fetching location and activities for ${moduleType}...`);

        let determinedLocationKey = "Default";
        let statusMsg = "";

        const activitySource = moduleType === 'couples' 
            ? MOCK_COUPLES_ACTIVITIES_BY_CITY 
            : MOCK_ACTIVITIES_BY_CITY;
        
        if (navigator.geolocation) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
                statusMsg = `Using profile location for ${moduleType} activities: ${determinedLocationKey}. (Live location: ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)})`;
            } catch (error: any) {
                determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
                statusMsg = `Could not get live location for ${moduleType} activities. Using profile location: ${determinedLocationKey}.`;
                if (error.code === error.PERMISSION_DENIED) {
                    statusMsg = `Location access denied. Using profile location for ${moduleType} activities: ${determinedLocationKey}.`;
                }
            }
        } else {
            determinedLocationKey = MOCK_USER_PROFILE.location || "Default";
            statusMsg = `Geolocation not supported. Using profile location for ${moduleType} activities: ${determinedLocationKey}.`;
        }

        setCurrentLocationKey(determinedLocationKey);
        setLocationStatusMessage(statusMsg);

        const activitiesToShow = (activitySource[determinedLocationKey] || activitySource["Default"])
                                  .map(act => ({ ...act, isLiked: undefined }));

        setActivities(activitiesToShow);
        setIsLoading(false);
        
        if (activitiesToShow.length === 0) {
            toast({ 
                title: "No Activities Found", 
                description: `No local ${moduleType} activities found in ${determinedLocationKey}.`, 
                variant: "default" 
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
    };
}
