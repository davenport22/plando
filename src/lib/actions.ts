
'use server';

import { generateSuggestedItinerary, type GenerateSuggestedItineraryInput, type GenerateSuggestedItineraryOutput } from '@/ai/flows/generate-suggested-itinerary';
import { generateActivityDescription, type GenerateActivityDescriptionInput, type GenerateActivityDescriptionOutput } from '@/ai/flows/generate-activity-description-flow';
import { generateDestinationImage } from '@/ai/flows/generate-destination-image-flow';
import { type ActivityInput, type Trip, type UserProfile, MOCK_USER_PROFILE, ALL_MOCK_USERS, type Activity } from '@/types';
import { firestore, isFirebaseInitialized } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { format } from 'date-fns';

// This function will be called from client components to generate the itinerary.
export async function suggestItineraryAction(
  tripId: string,
  activities: ActivityInput[],
  startDate: string,
  endDate: string
): Promise<GenerateSuggestedItineraryOutput | { error: string }> {
  try {
    if (!activities || activities.length === 0) {
      return { error: "No activities provided to generate an itinerary." };
    }
    if (!startDate || !endDate) {
      return { error: "Start and end dates are required."}
    }

    const input: GenerateSuggestedItineraryInput = {
      activities,
      startDate,
      endDate,
    };

    console.log("Calling generateSuggestedItinerary with input:", JSON.stringify(input, null, 2));

    const result = await generateSuggestedItinerary(input);
    
    console.log("Received itinerary from AI:", JSON.stringify(result, null, 2));
    
    // Validate or transform the result if needed
    if (!result || !result.itinerary) {
        console.error("AI did not return a valid itinerary structure.");
        return { error: "Failed to generate itinerary: AI returned invalid data." };
    }
    
    return result;

  } catch (error) {
    console.error("Error generating itinerary:", error);
    // Check if error is an instance of Error and has a message property
    if (error instanceof Error) {
        return { error: `Failed to generate itinerary: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating the itinerary." };
  }
}


export async function enhanceActivityDescriptionAction(
  activityName: string,
  location: string
): Promise<GenerateActivityDescriptionOutput | { error: string }> {
  try {
    if (!activityName || !location) {
      return { error: "Activity name and location are required to enhance description." };
    }

    const input: GenerateActivityDescriptionInput = {
      activityName,
      location,
    };

    // console.log("Calling generateActivityDescription with input:", JSON.stringify(input, null, 2));
    const result = await generateActivityDescription(input);
    // console.log("Received enhanced description from AI:", JSON.stringify(result, null, 2));

    if (!result || !result.description) {
      console.error("AI did not return a valid description.");
      return { error: "Failed to generate enhanced description: AI returned invalid data." };
    }
    return result;

  } catch (error) {
    console.error("Error generating enhanced activity description:", error);
    if (error instanceof Error) {
      return { error: `Failed to generate enhanced description: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating the enhanced description." };
  }
}

// Type for data coming from the NewTripForm
type NewTripData = Omit<Trip, 'id' | 'ownerId' | 'participantIds'> & {
    startDate: string;
    endDate: string;
};


export async function createTrip(data: NewTripData): Promise<{ error: string } | void> {
    if (!isFirebaseInitialized) {
        return { error: 'Backend is not configured. Please set up Firebase credentials in your .env file.' };
    }

    try {
        if (!data.name || !data.destination || !data.startDate || !data.endDate) {
            return { error: 'Missing required fields.' };
        }
        
        // Generate a unique image for the trip destination
        let imageUrl = `https://placehold.co/600x400.png`; // Fallback image
        try {
            const generatedImageUrl = await generateDestinationImage({ destination: data.destination });
            if (generatedImageUrl) {
                imageUrl = generatedImageUrl;
            }
        } catch (imageError) {
            console.warn(`AI image generation failed for destination "${data.destination}". Using fallback.`, imageError);
            // We don't block trip creation if image generation fails, just use the fallback.
        }

        const newTrip: Omit<Trip, 'id'> = {
            name: data.name,
            destination: data.destination,
            startDate: data.startDate,
            endDate: data.endDate,
            ownerId: 'user1', // In a real app, get this from the authenticated session
            participantIds: ['user1'],
            imageUrl: imageUrl,
            // Sanitize optional fields to be either a valid value or undefined.
            // This prevents invalid data like NaN from being sent to Firestore.
            latitude: data.latitude && !isNaN(data.latitude) ? data.latitude : undefined,
            longitude: data.longitude && !isNaN(data.longitude) ? data.longitude : undefined,
            placeId: data.placeId || undefined,
        };

        // Firestore's 'add' method automatically ignores keys with 'undefined' values.
        const docRef = await firestore.collection('trips').add(newTrip);

        // Instead of just redirecting, we can redirect to the newly created trip's page
        revalidatePath('/login'); // Invalidate cache for the trips list page
        redirect(`/trips/${docRef.id}`); // Navigate to the new trip's detail page

    } catch (e) {
        console.error('Error creating trip in Firestore:', e);
        if (e instanceof Error) return { error: e.message };
        return { error: 'An unknown error occurred while creating the trip.' };
    }
}

export async function getTrip(tripId: string): Promise<Trip | null> {
    try {
        const tripDoc = await firestore.collection('trips').doc(tripId).get();
        if (!tripDoc.exists) {
            return null;
        }
        const data = tripDoc.data()!;
        // Ensure all fields of the Trip interface are present
        return {
            id: tripDoc.id,
            name: data.name || 'Untitled Trip',
            destination: data.destination || 'Unknown Destination',
            startDate: data.startDate,
            endDate: data.endDate,
            ownerId: data.ownerId,
            participantIds: data.participantIds || [],
            imageUrl: data.imageUrl,
            latitude: data.latitude,
            longitude: data.longitude,
            placeId: data.placeId,
        };
    } catch (error) {
        console.error(`Error fetching trip ${tripId}:`, error);
        return null;
    }
}

export async function updateTrip(tripId: string, data: Partial<Trip>): Promise<{ success: boolean; error?: string }> {
    try {
        if (!tripId) {
            return { success: false, error: "Trip ID is required." };
        }
        await firestore.collection('trips').doc(tripId).update(data);

        revalidatePath(`/trips/${tripId}`);
        revalidatePath('/login');

        return { success: true };
    } catch (error) {
        console.error(`Error updating trip for ${tripId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}


// --- User Profile Actions ---

/**
 * Creates or retrieves a user profile in Firestore after authentication.
 * @param user The authenticated user object from Firebase Auth.
 * @returns The user's profile from Firestore and a flag indicating if the user was newly created.
 */
export async function getOrCreateUserProfile(user: {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}): Promise<{ profile: UserProfile; isNewUser: boolean } | null> {
  if (!isFirebaseInitialized) {
    console.error('Backend is not configured. Cannot get or create user profile.');
    return null;
  }
  
  const userRef = firestore.collection('users').doc(user.uid);
  
  try {
    const doc = await userRef.get();
    if (doc.exists) {
      // User profile already exists, return it.
      return { profile: doc.data() as UserProfile, isNewUser: false };
    } else {
      // User profile doesn't exist, create a new one.
      const newUserProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        name: user.name || 'New User',
        avatarUrl: user.photoURL || `https://avatar.vercel.sh/${user.email}.png`,
        bio: '',
        location: '',
        memberSince: format(new Date(), 'MMMM yyyy'),
        interests: [],
      };
      await userRef.set(newUserProfile);
      return { profile: newUserProfile, isNewUser: true };
    }
  } catch (error) {
    console.error(`Error getting or creating profile for user ${user.uid}:`, error);
    return null;
  }
}

/**
 * Fetches a user profile from Firestore. This function ONLY reads data.
 * @param userId The ID of the user to fetch.
 * @returns A UserProfile object or null if not found.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isFirebaseInitialized) return null;
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user profile for ${userId}:`, error);
        return null;
    }
}


/**
 * Updates a user profile in Firestore.
 * @param userId The ID of the user to update.
 * @param data A partial UserProfile object with the fields to update.
 * @returns An object indicating success or failure.
 */
export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) {
        return { success: false, error: 'Backend is not configured. Please set up Firebase credentials in your .env file.' };
    }
    try {
        if (!userId) {
            return { success: false, error: "User ID is required." };
        }
        await firestore.collection('users').doc(userId).update(data);

        // Revalidate paths where this user's data might be displayed
        revalidatePath('/profile');
        revalidatePath(`/users/${userId}`);

        return { success: true };
    } catch (error) {
        console.error(`Error updating user profile for ${userId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

// --- Plando Couples Actions ---

/**
 * Finds a user by their email address. This function is robust against "NOT_FOUND"
 * errors that occur when the 'users' collection does not yet exist.
 * @param email The email of the user to find.
 * @returns A UserProfile object or null if not found.
 */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
        const usersRef = firestore.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();
        if (snapshot.empty) {
            return null;
        }
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error: any) {
        // This is a specific check for Firestore's "collection not found" error.
        // The error code is 5 (NOT_FOUND).
        if (error.code === 5 || (error.message && error.message.includes("NOT_FOUND"))) {
          console.log(`'users' collection not found while searching for email, which is expected on first run. Treating as "user not found".`);
          return null; // The collection doesn't exist, so the user can't exist.
        }
        console.error(`An unexpected error occurred in findUserByEmail for "${email}":`, error);
        // For any other error, re-throw it to be handled by the caller.
        throw error;
    }
}

/**
 * Saves a user's vote (like/dislike) for a couples activity.
 * @param userId The ID of the user voting.
 * @param activityId The ID of the activity being voted on.
 * @param liked A boolean indicating if the user liked the activity.
 * @returns An object indicating success or failure.
 */
export async function saveCoupleVote(userId: string, activityId: string, liked: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const voteRef = firestore.collection('users').doc(userId).collection('couplesVotes').doc(activityId);
        await voteRef.set({
            liked,
            votedAt: new Date().toISOString(),
        });
        return { success: true };
    } catch (error) {
        console.error(`Error saving vote for user ${userId}, activity ${activityId}:`, error);
        return { success: false, error: 'Failed to save your vote to the database.' };
    }
}

/**
 * Retrieves a list of liked activity IDs for a specific user.
 * @param userId The ID of the user whose liked activities to fetch.
 * @returns A promise that resolves to an array of liked activity IDs.
 */
export async function getLikedCouplesActivityIds(userId: string): Promise<string[]> {
    try {
        const votesSnapshot = await firestore.collection('users').doc(userId).collection('couplesVotes').where('liked', '==', true).get();
        return votesSnapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error(`Error fetching liked activity IDs for user ${userId}:`, error);
        // Return an empty array on error to prevent the app from crashing.
        return [];
    }
}

// --- Trip Activities Actions ---

export async function getTripActivities(tripId: string): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const activitiesSnapshot = await firestore.collection('trips').doc(tripId).collection('activities').get();
        return activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
    } catch (error) {
        console.error(`Error fetching activities for trip ${tripId}:`, error);
        return [];
    }
}

export async function addTripActivity(tripId: string, activityData: Omit<Activity, 'id'>): Promise<{ success: boolean; activityId?: string; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.'};
    try {
        const docRef = await firestore.collection('trips').doc(tripId).collection('activities').add(activityData);
        revalidatePath(`/trips/${tripId}`);
        return { success: true, activityId: docRef.id };
    } catch (error) {
        console.error(`Error adding activity to trip ${tripId}:`, error);
        return { success: false, error: 'Failed to add activity.' };
    }
}

export async function updateTripActivity(tripId: string, activityId: string, data: Partial<Activity>): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.'};
    try {
        await firestore.collection('trips').doc(tripId).collection('activities').doc(activityId).update(data);
        revalidatePath(`/trips/${tripId}`);
        return { success: true };
    } catch (error) {
        console.error(`Error updating activity ${activityId} in trip ${tripId}:`, error);
        return { success: false, error: 'Failed to update activity.' };
    }
}

export async function getCompletedTripsForUser(userId: string): Promise<Trip[]> {
  if (!isFirebaseInitialized) return [];
  try {
    const today = new Date().toISOString().split('T')[0];
    const tripsSnapshot = await firestore
        .collection('trips')
        .where('ownerId', '==', userId)
        .where('endDate', '<', today)
        .get();
        
    return tripsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Untitled Trip',
        destination: data.destination || 'Unknown',
        startDate: data.startDate || 'N/A',
        endDate: data.endDate || 'N/A',
        ownerId: data.ownerId || '',
        participantIds: data.participantIds || [],
        imageUrl: data.imageUrl,
      } as Trip;
    });
  } catch (error) {
    console.error(`Error fetching completed trips for user ${userId}:`, error);
    return [];
  }
}
