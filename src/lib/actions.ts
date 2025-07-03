
'use server';

import { generateSuggestedItinerary, type GenerateSuggestedItineraryInput, type GenerateSuggestedItineraryOutput } from '@/ai/flows/generate-suggested-itinerary';
import { generateActivityDescription, type GenerateActivityDescriptionInput, type GenerateActivityDescriptionOutput } from '@/ai/flows/generate-activity-description-flow';
import { generateDestinationImage } from '@/ai/flows/generate-destination-image-flow';
import { type ActivityInput, type Trip, type UserProfile, MOCK_USER_PROFILE, ALL_MOCK_USERS, type Activity } from '@/types';
import { firestore, isFirebaseInitialized } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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
 * Fetches a user profile from Firestore. If the user doesn't exist and it's a
 * mock user, it seeds the database with the mock data.
 * @param userId The ID of the user to fetch.
 * @returns A UserProfile object or null if not found.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();

        if (userDoc.exists) {
            return userDoc.data() as UserProfile;
        }

        const userToSeed = ALL_MOCK_USERS.find(u => u.id === userId);
        if (userToSeed) {
            await firestore.collection('users').doc(userId).set(userToSeed);
            return userToSeed;
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
        // gRPC error code 5 is 'NOT_FOUND'. This occurs when a query is made
        // on a collection that does not exist yet. We can safely treat this
        // as "user not found" and return null.
        if (error.code === 5) {
            console.log("Handled 'NOT_FOUND' error: 'users' collection likely doesn't exist yet. This is normal on the first run.");
            return null;
        }
        // For any other type of error, we log it and return null to prevent a crash.
        console.error(`An unexpected error occurred while finding user by email "${email}":`, error);
        return null;
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


// --- Authentication Actions ---

const registerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  location: z.string().min(2, "Location is required.").max(100, "Location is too long."),
  bio: z.string().max(500).optional().default(""),
  avatarUrl: z.string().url().or(z.literal("")).optional().default(""),
  interests: z.array(z.string()).optional().default([]),
});

export async function registerUserAction(values: z.infer<typeof registerFormSchema>): Promise<{ error?: string; success?: boolean }> {
  if (!isFirebaseInitialized) {
    return { error: 'Backend is not configured. Please set up Firebase credentials in your .env file.' };
  }
  const validation = registerFormSchema.safeParse(values);
  if (!validation.success) {
    return { error: "Invalid form data." };
  }
  const { email, name, ...otherData } = validation.data;

  try {
    const existingUser = await findUserByEmail(email.toLowerCase());

    if (existingUser) {
      return { error: 'A user with this email address already exists.' };
    }
    
    const usersRef = firestore.collection('users');
    const newUserId = usersRef.doc().id;
    const newUserProfile: UserProfile = {
      id: newUserId,
      email: email.toLowerCase(),
      name,
      memberSince: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      ...otherData,
    };
    
    // The 'set' operation will automatically create the 'users' collection if it's the first document.
    await usersRef.doc(newUserId).set(newUserProfile);
    
    revalidatePath('/');
    return { success: true };

  } catch (e) {
    console.error('Error during user registration:', e);
    const errorMessage = e instanceof Error ? e.message : "An unknown server error occurred.";
    return { error: errorMessage };
  }
}

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function loginUserAction(values: z.infer<typeof loginFormSchema>): Promise<{ error?: string; success?: boolean } | void> {
    if (!isFirebaseInitialized) {
        return { error: 'Backend is not configured. Please set up Firebase credentials in your .env file.' };
    }
    const validation = loginFormSchema.safeParse(values);
    if (!validation.success) {
        return { error: "Invalid form data." };
    }
    const { email } = validation.data;

    try {
        const user = await findUserByEmail(email.toLowerCase());

        if (!user) {
            return { error: 'No user found with this email address.' };
        }
        
        // In a real app, you would compare a hashed password here.
        // For this prototype, we just check if the user exists.
        
        // On successful login, we redirect to the main trips page.
        // Note: The app still uses a hardcoded user ID for data fetching.
        // This action just simulates the login process.
        redirect('/login');

    } catch (e) {
        console.error('Error during login:', e);
        const errorMessage = e instanceof Error ? e.message : "An unknown server error occurred.";
        return { error: errorMessage };
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
