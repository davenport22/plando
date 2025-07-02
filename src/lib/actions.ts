
'use server';

import { generateSuggestedItinerary, type GenerateSuggestedItineraryInput, type GenerateSuggestedItineraryOutput } from '@/ai/flows/generate-suggested-itinerary';
import { generateActivityDescription, type GenerateActivityDescriptionInput, type GenerateActivityDescriptionOutput } from '@/ai/flows/generate-activity-description-flow';
import { type ActivityInput, type Trip, type UserProfile, MOCK_USER_PROFILE, ALL_MOCK_USERS } from '@/types';
import { firestore } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
type NewTripData = Omit<Trip, 'id' | 'ownerId' | 'participantIds'>;

export async function createTrip(data: NewTripData): Promise<{ error: string } | void> {
    try {
        if (!data.name || !data.destination || !data.startDate || !data.endDate) {
            return { error: 'Missing required fields.' };
        }
        
        const newTrip = {
            ...data,
            ownerId: 'user1', // In a real app, get this from the authenticated session
            participantIds: ['user1'],
            // Use a generic placeholder and let the AI hint drive image selection later
            imageUrl: `https://placehold.co/600x400.png`
        };

        await firestore.collection('trips').add(newTrip);

    } catch (e) {
        console.error('Error creating trip in Firestore:', e);
        if (e instanceof Error) return { error: e.message };
        return { error: 'An unknown error occurred while creating the trip.' };
    }

    revalidatePath('/login'); // Invalidate cache for the trips list page
    redirect('/login'); // Navigate to the trips list page
}

// --- User Profile Actions ---

/**
 * Fetches a user profile from Firestore. If the user doesn't exist and it's the
 * primary mock user, it seeds the database with the mock data.
 * @param userId The ID of the user to fetch.
 * @returns A UserProfile object or null if not found.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            // For this prototype, if the main user doesn't exist, create them from mock data.
            // This ensures the app works on first run without manual DB setup.
            if (userId === MOCK_USER_PROFILE.id) {
                await firestore.collection('users').doc(userId).set(MOCK_USER_PROFILE);
                return MOCK_USER_PROFILE;
            }
            // In a real app, you might want to fetch other mock users as well or just return null.
            const otherMockUser = ALL_MOCK_USERS.find(u => u.id === userId);
            if (otherMockUser) {
                await firestore.collection('users').doc(userId).set(otherMockUser);
                return otherMockUser;
            }
            return null;
        }

        return userDoc.data() as UserProfile;
    } catch (error) {
        console.error(`Error fetching user profile for ${userId}:`, error);
        // To prevent app crashes, return null on error. The UI should handle this.
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
