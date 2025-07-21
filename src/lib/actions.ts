

'use server';

import { generateSuggestedItinerary, type GenerateSuggestedItineraryInput, type GenerateSuggestedItineraryOutput } from '@/ai/flows/generate-suggested-itinerary';
import { generateActivityDescription } from '@/ai/flows/generate-activity-description-flow';
import { generateDestinationImage } from '@/ai/flows/generate-destination-image-flow';
import { generateInvitationEmail } from '@/ai/flows/generate-invitation-email-flow';
import { extractActivityDetailsFromUrl, type ExtractActivityDetailsFromUrlOutput } from '@/ai/flows/extract-activity-details-from-url-flow';
import { sendEmail } from '@/lib/emailService';
import { type ActivityInput, type Trip, type UserProfile, type Activity, type Itinerary, ItineraryGenerationRule, type CompletedActivity, type ConnectionRequest } from '@/types';
import { firestore, isFirebaseInitialized } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { generateAndStoreActivityImage } from './aiUtils';
import { getAuth } from 'firebase-admin/auth';

/**
 * Standardized error handler for AI-related operations.
 * It logs the full error for debugging and returns a user-friendly message.
 * @param error - The caught error object.
 * @param defaultMessage - A default message describing the failed operation.
 * @returns An object containing a user-friendly error string.
 */
const handleAIError = (error: unknown, defaultMessage: string): { error: string } => {
    console.error(defaultMessage, error);
    if (error instanceof Error) {
        if (error.message.includes("503") || error.message.includes("overloaded")) {
            return { error: "The AI service is currently busy or unavailable. Please try again in a few moments." };
        }
        if (error.message.includes("API key not valid")) {
            return { error: 'The provided GOOGLE_API_KEY is not valid. Please generate a new key from Google AI Studio and add it to your .env file.' };
        }
        if (error.message.includes("API key not found")) {
            return { error: 'The GOOGLE_API_KEY environment variable is not set. Please add it to your .env file.' };
        }
         if (error.message.includes("permission denied")) {
            return { error: 'Permission denied. Please ensure the Generative Language API is enabled in your Google Cloud project for the provided API key.' };
        }
        return { error: `${defaultMessage}: ${error.message}` };
    }
    return { error: "An unknown error occurred." };
}

// =================================================================================
// --- AI-Powered Actions ---
// =================================================================================

/**
 * Generates a suggested itinerary for a trip based on activities that have been voted on by participants.
 * @param tripId - The ID of the trip to generate an itinerary for.
 * @returns A promise that resolves to the generated itinerary object or an error object.
 */
export async function suggestItineraryAction(
  tripId: string
): Promise<GenerateSuggestedItineraryOutput | { error: string }> {
  try {
    const trip = await getTrip(tripId);
    if (!trip) {
      return { error: "Trip not found. Cannot generate itinerary." };
    }

    if (!trip.startDate || !trip.endDate) {
      return { error: "Trip start and end dates are required to generate an itinerary." };
    }

    const allActivities = await getTripActivities(tripId, trip.ownerId);

    const rule = trip.itineraryGenerationRule || 'majority';
    const numParticipants = trip.participantIds.length;
    
    // Filter activities based on the trip's itinerary generation rule.
    const qualifiedActivities = allActivities.filter(act => {
        if (act.likes === 0) return false;

        if (rule === 'all') {
            // All participants must have liked it. This implies everyone voted.
            return act.likes === numParticipants;
        } else { // 'majority' rule
            const hasMajorityOfVotes = act.likes > act.dislikes;
            
            // A quorum is required: at least half the participants must have voted.
            const totalVotes = act.likes + act.dislikes;
            const quorum = Math.ceil(numParticipants / 2);
            const hasQuorum = totalVotes >= quorum;

            return hasMajorityOfVotes && hasQuorum;
        }
    });
    
    if (qualifiedActivities.length === 0) {
      return { error: `No activities met the required threshold based on your trip's itinerary rule ("${rule}"). Please have more participants vote on activities.` };
    }

    const activitiesInput: ActivityInput[] = qualifiedActivities.map(act => ({
      name: act.name,
      duration: act.duration,
      location: act.location,
      isLiked: true, // All qualified activities are treated as 'liked' for generation purposes.
    }));

    const input: GenerateSuggestedItineraryInput = {
      activities: activitiesInput,
      startDate: trip.startDate,
      endDate: trip.endDate,
    };

    const result = await generateSuggestedItinerary(input);
    
    if (!result || !result.itinerary) {
        return { error: "Failed to generate itinerary: AI returned invalid data." };
    }
    
    return result;

  } catch (error) {
    return handleAIError(error, "Failed to generate itinerary");
  }
}

/**
 * Extracts structured activity details from a given URL using an AI model.
 * @param url - The URL of the webpage to parse.
 * @returns A promise resolving to the extracted activity details or an error object.
 */
export async function extractActivityDetailsFromUrlAction(
  url: string
): Promise<ExtractActivityDetailsFromUrlOutput | { error: string }> {
  const urlValidation = z.string().url().safeParse(url);
  if (!urlValidation.success) {
    return { error: 'Invalid URL provided.' };
  }

  try {
    const result = await extractActivityDetailsFromUrl({ url });
    if (!result || !result.name) {
      return { error: 'Failed to extract details: AI returned invalid data.' };
    }
    return result;
  } catch (error) {
    return handleAIError(error, 'Failed to extract details from URL');
  }
}

// =================================================================================
// --- Trip Actions ---
// =================================================================================

// Zod schema for validating new trip data from the client.
const NewTripDataSchema = z.object({
    name: z.string(),
    destination: z.string(),
    startDate: z.string(), // YYYY-MM-DD format
    endDate: z.string(),   // YYYY-MM-DD format
    itineraryGenerationRule: z.enum(['majority', 'all']),
    participantEmails: z.array(z.string().email()).optional(),
    syncLocalActivities: z.boolean().optional(),
});

/**
 * Creates a new trip, adds participants, and sends invitations.
 * @param data - The data for the new trip, validated against NewTripDataSchema.
 * @param ownerId - The UID of the user creating the trip.
 * @returns A promise resolving to an object indicating success, with the new tripId or an error.
 */
export async function createTrip(data: z.infer<typeof NewTripDataSchema>, ownerId: string): Promise<{ success: boolean; tripId?: string; error?: string }> {
    if (!isFirebaseInitialized) {
        return { success: false, error: 'Firebase is not initialized. Please check server credentials in .env file.' };
    }

    try {
        const validatedData = NewTripDataSchema.parse(data);
        const { participantEmails = [], ...tripDetails } = validatedData;
        
        const ownerProfile = await getUserProfile(ownerId);
        if (!ownerProfile) {
            return { success: false, error: "Trip creator's profile not found." };
        }

        // Separate existing users from emails that need an invitation.
        const participantIds = new Set<string>([ownerId]);
        const emailsToInvite: string[] = [];
        for (const email of participantEmails) {
            if (email.toLowerCase() === ownerProfile.email.toLowerCase()) continue;
            const userToAdd = await findUserByEmail(email);
            if (userToAdd) {
                participantIds.add(userToAdd.id);
            } else {
                emailsToInvite.push(email);
            }
        }
        
        // Generate a destination image using an AI model.
        const imageUrl = await generateDestinationImage({ destination: tripDetails.destination });

        const newTripData = {
            ...tripDetails,
            ownerId,
            participantIds: Array.from(participantIds),
            invitedEmails: emailsToInvite,
            imageUrl,
        };

        const docRef = await firestore.collection('trips').add(newTripData);
        const tripId = docRef.id;

        // Asynchronously send invitation emails to new users.
        if (emailsToInvite.length > 0) {
            emailsToInvite.forEach(email => {
                generateInvitationEmail({
                    recipientEmail: email,
                    tripName: tripDetails.name,
                    inviterName: ownerProfile.name,
                    tripId,
                }).then(emailContent => {
                    sendEmail({ to: email, subject: emailContent.subject, html: emailContent.body });
                }).catch(genError => {
                    console.error(`Background email generation failed for ${email}:`, handleAIError(genError, "Failed to generate invitation email"));
                });
            });
        }

        revalidatePath('/trips');
        revalidatePath(`/trips/${tripId}`);
        return { success: true, tripId };

    } catch (e) {
        console.error('Error creating trip:', e);
        if (e instanceof Error && (e.message.includes("API") || e.message.includes("permission"))) {
            return { success: false, ...handleAIError(e, "Could not create trip due to an AI service error.") };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error: `Failed to create trip: ${errorMessage}` };
    }
}

/**
 * Deletes a trip and all its associated subcollections (activities, itineraries).
 * @param tripId - The ID of the trip to delete.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function deleteTrip(tripId: string): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Firebase is not initialized.' };

    try {
        if (!tripId) return { success: false, error: "Trip ID is required." };

        const tripRef = firestore.collection('trips').doc(tripId);
        
        // Recursively delete subcollections.
        const activitiesQuery = tripRef.collection('activities').limit(500);
        const itinerariesQuery = tripRef.collection('itineraries').limit(500);
        await new Promise<number>((resolve, reject) => deleteQueryBatch(activitiesQuery, resolve, reject));
        await new Promise<number>((resolve, reject) => deleteQueryBatch(itinerariesQuery, resolve, reject));
        
        await tripRef.delete();

        revalidatePath('/trips');
        return { success: true };
    } catch (error) {
        console.error(`Error deleting trip ${tripId}:`, error);
        return { success: false, error: "Failed to delete trip." };
    }
}


/**
 * Retrieves detailed information for a single trip, including populated participant profiles.
 * @param tripId - The ID of the trip to fetch.
 * @returns A promise resolving to the Trip object or null if not found.
 */
export async function getTrip(tripId: string): Promise<Trip | null> {
    try {
        const tripDoc = await firestore.collection('trips').doc(tripId).get();
        if (!tripDoc.exists) {
            return null;
        }
        const data = tripDoc.data()!;

        // Fetch profiles for all participant IDs.
        const participantIds = data.participantIds || [];
        const participantProfiles = await Promise.all(
            participantIds.map((id: string) => getUserProfile(id))
        );
        
        const participants = participantProfiles.filter((p): p is UserProfile => p !== null);

        return {
            id: tripDoc.id,
            name: data.name || 'Untitled Trip',
            destination: data.destination || 'Unknown Destination',
            startDate: data.startDate,
            endDate: data.endDate,
            ownerId: data.ownerId,
            participantIds: participantIds,
            participants: participants,
            invitedEmails: data.invitedEmails || [],
            imageUrl: data.imageUrl,
            itineraryGenerationRule: data.itineraryGenerationRule || 'majority',
            syncLocalActivities: data.syncLocalActivities ?? true,
            latitude: data.latitude,
            longitude: data.longitude,
            placeId: data.placeId,
        };
    } catch (error) {
        console.error(`Error fetching trip ${tripId}:`, error);
        return null;
    }
}

/**
 * Fetches all trips that a given user is a participant of.
 * @param userId - The UID of the user.
 * @returns A promise resolving to an object with a list of trips or an error.
 */
export async function getTripsForUser(userId: string): Promise<{ success: boolean; trips?: Trip[]; error?: string }> {
    if (!isFirebaseInitialized) {
        // Attempt to check for a connection error to provide a more helpful message.
        try {
            await firestore.listCollections();
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
    try {
        const tripsSnapshot = await firestore.collection('trips').where('participantIds', 'array-contains', userId).get();
        const trips = tripsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Untitled Trip',
                destination: data.destination || 'Unknown',
                startDate: data.startDate || 'N/A',
                endDate: data.endDate || 'N/A',
                ownerId: data.ownerId || '',
                participantIds: data.participantIds || [],
                participants: [],
                imageUrl: data.imageUrl,
            } as Trip;
        });
        return { success: true, trips };
    } catch (error) {
        console.error("Failed to fetch trips from Firestore:", error);
        let errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching trips.";
        if (error instanceof Error && (error.message.includes("NOT_FOUND") || error.message.includes("Could not find Collection"))) {
            errorMessage = `Could not connect to the database. Please ensure your Firestore database is created and that its region matches your Storage bucket's region (e.g., 'europe-west1'). Details: ${errorMessage}`;
        }
        return { success: false, error: errorMessage };
    }
}

/**
 * Updates an existing trip's details.
 * If the destination changes, it automatically generates a new header image.
 * @param tripId - The ID of the trip to update.
 * @param data - An object containing the trip fields to update.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function updateTrip(tripId: string, data: Partial<Trip>): Promise<{ success: boolean; error?: string }> {
    try {
        if (!tripId) return { success: false, error: "Trip ID is required." };
        
        const tripRef = firestore.collection('trips').doc(tripId);
        const currentTripDoc = await tripRef.get();
        if (!currentTripDoc.exists) return { success: false, error: "Trip not found." };

        const updatedData = { ...data };
        const currentTripData = currentTripDoc.data() as Trip;

        // Generate a new image if the destination changes.
        if (updatedData.destination && currentTripData.destination !== updatedData.destination) {
            updatedData.imageUrl = await generateDestinationImage({ destination: updatedData.destination });
        }

        await tripRef.update(updatedData);

        revalidatePath(`/trips/${tripId}`);
        revalidatePath('/trips');

        return { success: true };
    } catch (error) {
        console.error(`Error updating trip for ${tripId}:`, error);
        if (error instanceof Error && (error.message.includes("API") || error.message.includes("permission"))) {
            return { success: false, ...handleAIError(error as any, "Could not update trip due to an AI service error.") };
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to update trip: ${errorMessage}` };
    }
}

// =================================================================================
// --- Participant & Invitation Actions ---
// =================================================================================

/**
 * Adds a participant to a trip by email. If the user exists, they are added directly.
 * If not, an invitation email is sent.
 * @param tripId - The ID of the trip.
 * @param email - The email of the user to add/invite.
 * @param inviterName - The name of the person sending the invitation.
 * @returns A promise resolving to an object indicating success, with a message or an error.
 */
export async function addParticipantToTrip(tripId: string, email: string, inviterName: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
        if (!email.trim() || !z.string().email().safeParse(email.trim()).success) {
            return { success: false, error: "Please enter a valid email address." };
        }
        
        const tripRef = firestore.collection('trips').doc(tripId);
        const tripDoc = await tripRef.get();
        if (!tripDoc.exists) return { success: false, error: "Trip not found." };
        const tripData = tripDoc.data() as Trip;
        
        const userToAdd = await findUserByEmail(email);
        
        if (userToAdd) { // User exists
            if (tripData.participantIds.includes(userToAdd.id)) return { success: false, error: "This user is already a participant." };
    
            await tripRef.update({ 
                participantIds: FieldValue.arrayUnion(userToAdd.id),
                invitedEmails: FieldValue.arrayRemove(email) // Remove from invited list if they were there
            });
    
            revalidatePath(`/trips/${tripId}`);
            return { success: true, message: `${userToAdd.name} has been added to the trip.` };
        } else { // User does not exist, send invitation
            if (tripData.invitedEmails?.includes(email)) {
                return { success: false, error: "This email has already been invited." };
            }

            await tripRef.update({ invitedEmails: FieldValue.arrayUnion(email) });

            // Asynchronously generate and send email.
            generateInvitationEmail({
                recipientEmail: email,
                tripName: tripData.name,
                inviterName,
                tripId,
            }).then(emailContent => {
                sendEmail({ to: email, subject: emailContent.subject, html: emailContent.body });
            }).catch(genError => {
                console.error(`Background email generation failed for ${email}:`, handleAIError(genError, "Failed to generate invitation email"));
            });

            revalidatePath(`/trips/${tripId}`);
            return { success: true, message: `User not found. An invitation has been sent to ${email}.` };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Re-sends an invitation email to a user who has not yet signed up.
 * @param tripId - The ID of the trip.
 * @param recipientEmail - The email to resend the invitation to.
 * @param inviterName - The name of the person sending the invitation.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function resendInvitation(tripId: string, recipientEmail: string, inviterName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tripDoc = await firestore.collection('trips').doc(tripId).get();
    if (!tripDoc.exists) return { success: false, error: 'Trip not found.' };
    const tripName = tripDoc.data()!.name;

    const emailContent = await generateInvitationEmail({ recipientEmail, tripName, inviterName, tripId });
    await sendEmail({ to: recipientEmail, subject: emailContent.subject, html: emailContent.body });

    revalidatePath(`/trips/${tripId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && (error.message.includes("API") || error.message.includes("permission"))) {
        return { success: false, ...handleAIError(error, "Could not resend invitation due to an AI service error.") };
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while resending the invitation.';
    return { success: false, error: errorMessage };
  }
}

/**
 * Allows a logged-in user to join an existing trip using a Trip ID.
 * @param tripId - The ID of the trip to join.
 * @param userId - The UID of the user joining the trip.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function joinTripWithId(tripId: string, userId: string | null): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
    if (!userId) return { success: false, error: 'You must be logged in to join a trip.' };
    
    try {
        const tripRef = firestore.collection('trips').doc(tripId);
        const tripDoc = await tripRef.get();
        if (!tripDoc.exists) return { success: false, error: 'Trip not found. Please check the ID and try again.' };
        
        const tripData = tripDoc.data() as Trip;
        if (tripData.participantIds.includes(userId)) return { success: false, error: "You are already a member of this trip." };
        
        const userProfile = await getUserProfile(userId);
        if (!userProfile) return { success: false, error: 'Your user profile could not be found.'};

        await tripRef.update({ 
            participantIds: FieldValue.arrayUnion(userId),
            invitedEmails: FieldValue.arrayRemove(userProfile.email),
        });

        revalidatePath('/trips');
        revalidatePath(`/trips/${tripId}`);
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to join trip: ${errorMessage}` };
    }
}

/**
 * Removes a participant from a trip. The owner cannot be removed.
 * @param tripId - The ID of the trip.
 * @param participantId - The UID of the participant to remove.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function removeParticipantFromTrip(tripId: string, participantId: string): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
    try {
        if (!tripId || !participantId) return { success: false, error: "Trip ID and participant ID are required." };

        const tripRef = firestore.collection('trips').doc(tripId);
        const tripDoc = await tripRef.get();
        if (!tripDoc.exists) return { success: false, error: "Trip not found." };

        const tripData = tripDoc.data() as Trip;
        if (tripData.ownerId === participantId) return { success: false, error: "The trip owner cannot be removed." };

        await tripRef.update({ participantIds: FieldValue.arrayRemove(participantId) });

        revalidatePath(`/trips/${tripId}`);
        revalidatePath('/trips');
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

// =================================================================================
// --- User Profile Actions ---
// =================================================================================

/**
 * Retrieves or creates a user profile in Firestore.
 * If the user is new, it creates a profile with default values.
 * If they exist, it returns their profile, potentially updating name/avatar from the auth provider.
 * @param user - The Firebase Auth user object.
 * @returns A promise resolving to the user's profile and a flag indicating if they were new.
 */
export async function getOrCreateUserProfile(user: {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}): Promise<{ profile: UserProfile; isNewUser: boolean }> {
  if (!isFirebaseInitialized) throw new Error('Server not configured. Please ensure Firebase credentials are in your .env file.');
  
  const userRef = firestore.collection('users').doc(user.uid);
  const doc = await userRef.get();

  if (doc.exists) {
    const existingProfile = doc.data() as UserProfile;
    const updates: Partial<UserProfile> = {};
    if (user.name && existingProfile.name === 'New User') {
        updates.name = user.name;
    }
    if (user.photoURL && existingProfile.avatarUrl?.includes('avatar.vercel.sh')) {
        updates.avatarUrl = user.photoURL;
    }

    if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
        return { profile: { ...existingProfile, ...updates }, isNewUser: false };
    }

    return { profile: existingProfile, isNewUser: false };
  } else {
    const newUserProfile: UserProfile = {
      id: user.uid,
      email: user.email || '',
      name: user.name || 'New User',
      avatarUrl: user.photoURL || `https://avatar.vercel.sh/${user.email || user.uid}.png`,
      bio: '',
      location: '',
      memberSince: format(new Date(), 'MMMM yyyy'),
      interests: [],
    };
    await userRef.set(newUserProfile);
    return { profile: newUserProfile, isNewUser: true };
  }
}

/**
 * Fetches a user's profile from Firestore by their UID.
 * @param userId - The UID of the user to fetch.
 * @returns A promise resolving to the UserProfile object or null if not found.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isFirebaseInitialized) return null;
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        return userDoc.exists ? userDoc.data() as UserProfile : null;
    } catch (error) {
        console.error(`Error fetching user profile for ${userId}:`, error);
        return null;
    }
}

/**
 * Updates a user's profile in Firestore.
 * @param userId - The UID of the user to update.
 * @param dataToUpdate - An object containing the profile fields to update.
 * @returns A promise resolving to an object with the updated profile or an error.
 */
export async function updateUserProfile(userId: string, dataToUpdate: Partial<UserProfile>): Promise<{ success: boolean; error?: string; updatedProfile?: UserProfile }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend is not configured.' };
    if (!userId) return { success: false, error: 'User ID is missing.' };

    try {
        const cleanData = Object.fromEntries(Object.entries(dataToUpdate).filter(([_, v]) => v !== undefined));

        if (Object.keys(cleanData).length > 0) {
            await firestore.collection('users').doc(userId).update(cleanData);
        }
        
        const updatedProfileDoc = await firestore.collection('users').doc(userId).get();
        const updatedProfile = updatedProfileDoc.data() as UserProfile;
        
        revalidatePath('/profile', 'layout');
        revalidatePath('/plando-friends');

        return { success: true, updatedProfile };

    } catch (error) {
        console.error(`Error updating profile for ${userId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Finds a user profile by their email address.
 * @param email - The email to search for.
 * @returns A promise resolving to the UserProfile object or null if not found.
 */
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
        const snapshot = await firestore.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
        if (snapshot.empty) return null;
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error: any) {
        if (error.code === 5 || (error.message && error.message.includes("NOT_FOUND"))) return null;
        console.error(`An unexpected error occurred in findUserByEmail for "${email}":`, error);
        throw error;
    }
}

// =================================================================================
// --- Plando Connection Actions (Partner & Friends) ---
// =================================================================================

/**
 * Internal helper to send a connection request (partner or friend).
 * This function validates the request before creating pending states on both users' documents.
 * @param fromUserId - The UID of the user sending the request.
 * @param toEmail - The email of the user to receive the request.
 * @param type - The type of connection ('partner' or 'friend').
 * @returns A promise resolving to an object indicating success or an error.
 */
async function internal_sendConnectionRequest(
    fromUserId: string, 
    toEmail: string, 
    type: 'partner' | 'friend'
): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
    if (!fromUserId || !toEmail) return { success: false, error: 'User ID and recipient email are required.' };

    try {
        const [fromUserProfile, toUserProfile] = await Promise.all([
            getUserProfile(fromUserId),
            findUserByEmail(toEmail)
        ]);
        
        // --- Start Validation ---
        if (!fromUserProfile) return { success: false, error: "Your user profile could not be found." };
        if (!toUserProfile) return { success: false, error: "Could not find a user with that email address." };

        const toUserId = toUserProfile.id;

        if (fromUserId === toUserId) return { success: false, error: "You cannot send a request to yourself." };

        if (type === 'partner') {
            if (fromUserProfile.partnerId) return { success: false, error: "You are already connected with a partner." };
            if (toUserProfile.partnerId) return { success: false, error: `${toUserProfile.name} is already connected with a partner.` };
            if (fromUserProfile.sentPartnerRequest) return { success: false, error: `You already have a pending partner request sent to ${fromUserProfile.sentPartnerRequest.fromUserEmail}.` };
            if (toUserProfile.partnerRequest) return { success: false, error: `${toUserProfile.name} already has a pending partner request.` };
        } else { // 'friend' type
            if (fromUserProfile.friendIds?.includes(toUserId)) return { success: false, error: `You are already friends with ${toUserProfile.name}.`};
            if (fromUserProfile.sentFriendRequests?.some(r => r.fromUserId === toUserId)) return { success: false, error: `You have already sent a friend request to ${toUserProfile.name}.`};
            if (fromUserProfile.friendRequests?.some(r => r.fromUserId === toUserId)) return { success: false, error: `You have a pending friend request from ${toUserProfile.name}. Please respond to it.`};
        }
        // --- End Validation ---

        // Create the request object for the recipient
        const requestForRecipient: ConnectionRequest = {
            fromUserId: fromUserId, 
            fromUserName: fromUserProfile.name,
            fromUserEmail: fromUserProfile.email,
            type,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        // Create the request object for the sender to track
        const requestForSender: ConnectionRequest = {
            fromUserId: toUserId,
            fromUserName: toUserProfile.name,
            fromUserEmail: toUserProfile.email,
            type,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        const fromUserRef = firestore.collection('users').doc(fromUserId);
        const toUserRef = firestore.collection('users').doc(toUserId);
        
        const batch = firestore.batch();
        
        if (type === 'partner') {
            batch.update(fromUserRef, { sentPartnerRequest: requestForSender });
            batch.update(toUserRef, { partnerRequest: requestForRecipient });
        } else {
            batch.update(fromUserRef, { sentFriendRequests: FieldValue.arrayUnion(requestForSender) });
            batch.update(toUserRef, { friendRequests: FieldValue.arrayUnion(requestForRecipient) });
        }
        
        await batch.commit();

        revalidatePath(`/plando-${type === 'partner' ? 'couples' : 'friends'}`);
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to send request: ${errorMessage}` };
    }
}

/**
 * Sends a partner connection request from one user to another.
 * @param fromUserId - The UID of the sender.
 * @param toEmail - The email of the recipient.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function sendPartnerRequest(fromUserId: string, toEmail: string) {
    return internal_sendConnectionRequest(fromUserId, toEmail, 'partner');
}

/**
 * Sends a friend connection request from one user to another.
 * @param fromUserId - The UID of the sender.
 * @param toEmail - The email of the recipient.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function sendFriendRequest(fromUserId: string, toEmail: string) {
    return internal_sendConnectionRequest(fromUserId, toEmail, 'friend');
}

/**
 * Cancels a pending connection request sent by the current user.
 * @param currentUserId - The UID of the user canceling the request.
 * @param toUserId - The UID of the user the request was sent to.
 * @param type - The type of connection ('partner' or 'friend').
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function cancelConnectionRequest(currentUserId: string, toUserId: string, type: 'partner' | 'friend'): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
    
    try {
        const fromUserRef = firestore.collection('users').doc(currentUserId);
        const toUserRef = firestore.collection('users').doc(toUserId);
        const batch = firestore.batch();

        if (type === 'partner') {
            batch.update(fromUserRef, { sentPartnerRequest: FieldValue.delete() });
            batch.update(toUserRef, { partnerRequest: FieldValue.delete() });
        } else {
            const fromUserDoc = await fromUserRef.get();
            const fromUserData = fromUserDoc.data() as UserProfile;
            const updatedSentRequests = fromUserData.sentFriendRequests?.filter(req => req.fromUserId !== toUserId) || [];
            batch.update(fromUserRef, { sentFriendRequests: updatedSentRequests });

            const toUserDoc = await toUserRef.get();
            const toUserData = toUserDoc.data() as UserProfile;
            const updatedIncomingRequests = toUserData.friendRequests?.filter(req => req.fromUserId !== currentUserId) || [];
            batch.update(toUserRef, { friendRequests: updatedIncomingRequests });
        }

        await batch.commit();
        revalidatePath(`/plando-${type === 'partner' ? 'couples' : 'friends'}`);
        return { success: true };
    } catch(error) {
         const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to cancel request: ${errorMessage}` };
    }
}

/**
 * Responds to an incoming connection request.
 * @param currentUserId - The UID of the user responding to the request.
 * @param fromUserId - The UID of the user who sent the request.
 * @param response - The response, either 'accepted' or 'declined'.
 * @param type - The type of connection ('partner' or 'friend').
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function respondToConnectionRequest(currentUserId: string, fromUserId: string, response: 'accepted' | 'declined', type: 'partner' | 'friend'): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };

    try {
        const currentUserRef = firestore.collection('users').doc(currentUserId);
        const fromUserRef = firestore.collection('users').doc(fromUserId);
        const batch = firestore.batch();

        if (type === 'partner') {
            batch.update(currentUserRef, { partnerRequest: FieldValue.delete() });
            batch.update(fromUserRef, { sentPartnerRequest: FieldValue.delete() });
            
            if (response === 'accepted') {
                batch.update(currentUserRef, { partnerId: fromUserId });
                batch.update(fromUserRef, { partnerId: currentUserId });
            }
        } else {
            const currentUserDoc = await currentUserRef.get();
            const fromUserDoc = await fromUserRef.get();
            if (!currentUserDoc.exists || !fromUserDoc.exists) {
                return { success: false, error: "One of the users in the request could not be found." };
            }

            const currentUserData = currentUserDoc.data() as UserProfile;
            const updatedIncomingRequests = currentUserData.friendRequests?.filter(req => req.fromUserId !== fromUserId) || [];
            batch.update(currentUserRef, { friendRequests: updatedIncomingRequests });

            const fromUserData = fromUserDoc.data() as UserProfile;
            const updatedSentRequests = fromUserData.sentFriendRequests?.filter(req => req.fromUserId !== currentUserId) || [];
            batch.update(fromUserRef, { sentFriendRequests: updatedSentRequests });

            if (response === 'accepted') {
                batch.update(currentUserRef, { friendIds: FieldValue.arrayUnion(fromUserId) });
                batch.update(fromUserRef, { friendIds: FieldValue.arrayUnion(currentUserId) });
            }
        }

        await batch.commit();
        revalidatePath(`/plando-${type === 'partner' ? 'couples' : 'friends'}`);
        return { success: true };
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to respond to request: ${errorMessage}` };
    }
}

/**
 * Disconnects a partner connection between two users.
 * @param currentUserId - The UID of the user initiating the disconnection.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function disconnectPartner(currentUserId: string): Promise<{ success: boolean; error?: string }> {
     if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
     if (!currentUserId) return { success: false, error: 'User ID is required.' };
    
    try {
        const currentUserDoc = await firestore.collection('users').doc(currentUserId).get();
        if (!currentUserDoc.exists) return { success: false, error: 'Current user not found.' };

        const currentUserProfile = currentUserDoc.data() as UserProfile;
        const partnerId = currentUserProfile.partnerId;

        // Atomically remove the partnerId from both users.
        const batch = firestore.batch();
        batch.update(firestore.collection('users').doc(currentUserId), { partnerId: FieldValue.delete() });
        if (partnerId) {
            batch.update(firestore.collection('users').doc(partnerId), { partnerId: FieldValue.delete() });
        }
        await batch.commit();
        
        revalidatePath('/plando-couples');
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to disconnect partner: ${errorMessage}` };
    }
}

/**
 * Disconnects a friend connection between two users.
 * @param currentUserId - The UID of the user initiating the disconnection.
 * @param friendId - The UID of the friend to disconnect from.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function disconnectFriend(currentUserId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
     if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
     if (!currentUserId || !friendId) return { success: false, error: 'User and friend IDs are required.' };
    
    try {
        const userRef = firestore.collection('users').doc(currentUserId);
        const friendRef = firestore.collection('users').doc(friendId);
        
        const batch = firestore.batch();
        batch.update(userRef, { 
            friendIds: FieldValue.arrayRemove(friendId),
            activeFriendId: FieldValue.delete() // Also clear active friend if they are the one being removed.
        });
        batch.update(friendRef, { friendIds: FieldValue.arrayRemove(currentUserId) });
        await batch.commit();
        
        revalidatePath('/plando-friends');
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to disconnect friend: ${errorMessage}` };
    }
}

/**
 * Fetches the profiles of all friends for a given user.
 * @param userId - The UID of the user.
 * @returns A promise resolving to an array of UserProfile objects.
 */
export async function getFriendsForUser(userId: string): Promise<UserProfile[]> {
    if (!isFirebaseInitialized || !userId) return [];
    try {
        const user = await getUserProfile(userId);
        if (!user || !user.friendIds || user.friendIds.length === 0) return [];

        const friendDocs = await firestore.collection('users').where(FieldValue.documentId(), 'in', user.friendIds).get();
        return friendDocs.docs.map(doc => doc.data() as UserProfile);

    } catch (error) {
        console.error("Error fetching friends for user:", error);
        return [];
    }
}

/**
 * Sets or unsets the active friend for a user, used for Plando Friends swiping.
 * @param userId - The UID of the current user.
 * @param friendId - The UID of the friend to set as active, or null to deactivate.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function setActiveFriend(userId: string, friendId: string | null): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized || !userId) return { success: false, error: "User not authenticated."};

    try {
        const userRef = firestore.collection('users').doc(userId);
        if (friendId) {
            await userRef.update({ activeFriendId: friendId });
        } else {
            await userRef.update({ activeFriendId: FieldValue.delete() });
        }
        revalidatePath('/plando-friends');
        return { success: true };
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to set active friend: ${errorMessage}` };
    }
}

// =================================================================================
// --- Plando Local Modules (Couples, Friends, Meet) Actions ---
// =================================================================================

/**
 * Internal helper to add a custom activity to the global `activities` collection.
 * This activity will be available in the specified Plando module.
 * @param userId - The UID of the user creating the activity.
 * @param module - The module to associate the activity with.
 * @param activityData - The core data for the new activity.
 * @returns A promise resolving to the created Activity object or an error.
 */
async function internal_addCustomLocalActivity(
  userId: string,
  module: 'couples' | 'friends' | 'meet',
  activityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'category' | 'startTime' | 'votes' | 'participants' | 'modules'>
): Promise<{ success: boolean; error?: string; activity?: Activity }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId) return { success: false, error: 'User ID is required.' };

  try {
    const newActivityRef = firestore.collection('activities').doc();
    
    // Generate an image and description with AI.
    const imageUrl = await generateAndStoreActivityImage(activityData.name, activityData.location, activityData.dataAiHint);
    const enhancedDetails = await generateActivityDescription({ activityName: activityData.name, location: activityData.location });

    const newActivity: Activity = {
        ...(activityData as Omit<Activity, 'id'>),
        ...enhancedDetails,
        id: newActivityRef.id,
        modules: [module],
        imageUrls: [imageUrl],
        createdBy: userId,
        likes: 0, 
        dislikes: 0,
    };

    await newActivityRef.set(newActivity);

    // If it's a couples activity, the creator automatically "likes" it.
    if (module === 'couples') {
      await saveCoupleVote(userId, newActivity.id, true);
    }
    
    revalidatePath(`/plando-${module}`);

    return { success: true, activity: newActivity };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to add custom activity: ${errorMessage}` };
  }
}

/** Adds a custom activity for the Plando Couples module. */
export async function addCustomCoupleActivity(userId: string, data: any) { return internal_addCustomLocalActivity(userId, 'couples', data); }
/** Adds a custom activity for the Plando Friends module. */
export async function addCustomFriendActivity(userId: string, data: any) { return internal_addCustomLocalActivity(userId, 'friends', data); }
/** Adds a custom activity for the Plando Meet module. */
export async function addCustomMeetActivity(userId: string, data: any) { return internal_addCustomLocalActivity(userId, 'meet', data); }


/**
 * Internal helper to retrieve local activities for a specific module and location.
 * It fetches activities created by the system, the current user, and their connected partner/friend.
 * @param module - The module ('couples', 'friends', 'meet').
 * @param location - The city to search for activities in.
 * @param userId - The current user's UID.
 * @param connectedId - The UID of the connected partner or friend.
 * @returns A promise resolving to an array of Activity objects.
 */
async function internal_getCustomLocalActivities(module: 'couples' | 'friends' | 'meet', location: string, userId?: string, connectedId?: string): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const locationToQuery = location || "Vienna, Austria";

        // Query activities created by the system, the user, or their connected partner/friend.
        const userIdsToQuery: string[] = ['system'];
        if (userId) userIdsToQuery.push(userId);
        if (connectedId) userIdsToQuery.push(connectedId);

        const q = firestore.collection('activities')
            .where('modules', 'array-contains', module)
            .where('location', '==', locationToQuery)
            .where('createdBy', 'in', userIdsToQuery);
        
        const querySnapshot = await q.get();

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
    } catch (error) {
        console.error(`Error fetching custom activities for module ${module} with location ${location}:`, error);
        return [];
    }
}

/** Fetches local activities for the Plando Couples module. */
export async function getCustomCouplesActivities(location?: string, userId?: string, partnerId?: string) { return internal_getCustomLocalActivities('couples', location || "Vienna, Austria", userId, partnerId); }
/** Fetches local activities for the Plando Friends module. */
export async function getCustomFriendActivities(location?: string, userId?: string, friendId?: string) { return internal_getCustomLocalActivities('friends', location || "Vienna, Austria", userId, friendId); }
/** Fetches local activities for the Plando Meet module. */
export async function getCustomMeetActivities(location?: string, userId?: string) { return internal_getCustomLocalActivities('meet', location || "Vienna, Austria", userId); }


/**
 * Saves a user's vote (like/dislike) for a Plando Couples activity.
 * @param userId - The UID of the user voting.
 * @param activityId - The ID of the activity being voted on.
 * @param liked - A boolean indicating if the activity was liked (true) or disliked (false).
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function saveCoupleVote(userId: string, activityId: string, liked: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        await firestore.collection('users').doc(userId).collection('couplesVotes').doc(activityId).set({ liked, votedAt: new Date().toISOString() });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to save your vote to the database.' };
    }
}

/**
 * Retrieves a list of activity IDs that a user has liked in the Plando Couples module.
 * @param userId - The UID of the user.
 * @returns A promise resolving to an array of activity IDs.
 */
export async function getLikedCouplesActivityIds(userId: string): Promise<string[]> {
    try {
        const snapshot = await firestore.collection('users').doc(userId).collection('couplesVotes').where('liked', '==', true).get();
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        return [];
    }
}

/**
 * Retrieves a list of all activity IDs a user has voted on (liked or disliked) in Plando Couples.
 * @param userId - The UID of the user.
 * @returns A promise resolving to an array of activity IDs.
 */
export async function getVotedOnCouplesActivityIds(userId: string): Promise<string[]> {
    try {
        const snapshot = await firestore.collection('users').doc(userId).collection('couplesVotes').get();
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error(`Error fetching voted-on couples activity IDs for user ${userId}:`, error);
        return [];
    }
}

/**
 * Marks a Plando Couples activity as completed for both partners and moves it to their history.
 * @param userId - The UID of the current user.
 * @param partnerId - The UID of the partner.
 * @param activity - The activity object to mark as completed.
 * @param wouldDoAgain - If true, removes the activity from their voted list so it can reappear in the future.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function markCoupleActivityAsCompleted(
  userId: string,
  partnerId: string,
  activity: Activity,
  wouldDoAgain: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId || !partnerId || !activity?.id) return { success: false, error: 'Missing required IDs or activity data.' };

  try {
    const batch = firestore.batch();
    
    const completedActivityData: CompletedActivity = {
        ...activity,
        completedDate: new Date().toISOString()
    };
    
    // Add to both users' completed history
    batch.set(firestore.collection('users').doc(userId).collection('completedCouplesActivities').doc(activity.id), completedActivityData);
    batch.set(firestore.collection('users').doc(partnerId).collection('completedCouplesActivities').doc(activity.id), completedActivityData);
    
    // If they would do it again, remove it from their voting history so it can reappear.
    if (wouldDoAgain) {
      batch.delete(firestore.collection('users').doc(userId).collection('couplesVotes').doc(activity.id));
      batch.delete(firestore.collection('users').doc(partnerId).collection('couplesVotes').doc(activity.id));
    }
    
    await batch.commit();

    revalidatePath('/plando-couples/matches');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Failed to mark activity ${activity.id} as done for couple ${userId}/${partnerId}:`, error);
    return { success: false, error: `Failed to update activity status: ${errorMessage}` };
  }
}

/**
 * Fetches the list of completed activities for a user in the Plando Couples module.
 * @param userId - The UID of the user.
 * @returns A promise resolving to an array of CompletedActivity objects.
 */
export async function getCompletedCouplesActivities(userId: string): Promise<CompletedActivity[]> {
    if (!isFirebaseInitialized || !userId) return [];
    try {
        const snapshot = await firestore.collection('users').doc(userId).collection('completedCouplesActivities').orderBy('completedDate', 'desc').get();
        return snapshot.docs.map(doc => doc.data() as CompletedActivity);
    } catch (error) {
        console.error(`Error fetching completed couples activities for user ${userId}:`, error);
        return [];
    }
}

// =================================================================================
// --- Trip-Specific Activity Actions ---
// =================================================================================

/**
 * Retrieves all activities for a given trip. This includes activities created specifically for the trip
 * and, if enabled, local activities from the trip's destination.
 * @param tripId - The ID of the trip.
 * @param userId - The UID of the current user, used to determine their vote status on each activity.
 * @returns A promise resolving to an array of Activity objects.
 */
export async function getTripActivities(tripId: string, userId: string): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const tripDoc = await firestore.collection('trips').doc(tripId).get();
        if (!tripDoc.exists) {
            console.error(`Trip with ID ${tripId} not found.`);
            return [];
        }
        const tripData = tripDoc.data() as Trip;

        const activitiesMap = new Map<string, Activity>();

        // 1. Get activities created specifically for this trip.
        const tripActivitiesSnapshot = await firestore.collection('trips').doc(tripId).collection('activities').get();
        tripActivitiesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            activitiesMap.set(doc.id, { 
                ...data, 
                id: doc.id,
                likes: data.likes || 0,
                dislikes: data.dislikes || 0,
                isLiked: data.votes?.[userId],
            } as Activity);
        });

        // 2. If enabled, also fetch and merge local activities from the destination city.
        if (tripData.syncLocalActivities && tripData.destination) {
            const localActivitiesSnapshot = await firestore.collection('activities').where('location', '==', tripData.destination).get();
            localActivitiesSnapshot.docs.forEach(doc => {
                if (!activitiesMap.has(doc.id)) {
                     activitiesMap.set(doc.id, {
                        ...(doc.data() as Activity),
                        id: doc.id,
                        tripId,
                        isLiked: undefined, // Not yet voted on in the context of this trip
                        likes: 0,
                        dislikes: 0,
                        votes: {},
                    });
                }
            });
        }

        return Array.from(activitiesMap.values());
    } catch (error) {
        console.error(`Error getting trip activities for trip ${tripId}:`, error)
        return [];
    }
}


/**
 * Adds a new custom activity to a specific trip's activity list.
 * @param tripId - The ID of the trip.
 * @param activityData - The core data for the new activity.
 * @param creatorId - The UID of the user creating the activity.
 * @returns A promise resolving to the created Activity object or an error.
 */
export async function addTripActivity(
  tripId: string,
  activityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'votes' | 'category' | 'startTime' | 'participants' | 'modules'>,
  creatorId: string
): Promise<{ success: boolean; newActivity?: Activity; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.'};
    try {
        const imageUrl = await generateAndStoreActivityImage(activityData.name, activityData.location, activityData.dataAiHint);
        const enhancedDetails = await generateActivityDescription({ activityName: activityData.name, location: activityData.location });

        const docRef = firestore.collection('trips').doc(tripId).collection('activities').doc();
        const newActivityPayload: Activity = {
            ...(activityData as Omit<Activity, 'id'>),
            ...enhancedDetails,
            id: docRef.id,
            imageUrls: [imageUrl],
            likes: 1, // Creator automatically likes it.
            dislikes: 0,
            isLiked: true, 
            votes: { [creatorId]: true }
        };

        await docRef.set(newActivityPayload);
        
        revalidatePath(`/trips/${tripId}`);
        return { success: true, newActivity: newActivityPayload };
    } catch (error) {
        return { success: false, error: 'Failed to add activity.' };
    }
}

/**
 * Records a user's vote on a trip activity. If the activity doesn't exist yet in the trip's
 * subcollection (i.e., it's a local activity being voted on for the first time), it's created first.
 * @param tripId - The ID of the trip.
 * @param activityId - The ID of the activity.
 * @param userId - The UID of the user voting.
 * @param vote - A boolean indicating the vote (true for like, false for dislike).
 * @returns A promise resolving to the updated Activity object or an error.
 */
export async function voteOnTripActivity(
    tripId: string, 
    activityId: string, 
    userId: string, 
    vote: boolean
): Promise<{ success: boolean; error?: string; updatedActivity?: Activity }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };

    const activityRef = firestore.collection('trips').doc(tripId).collection('activities').doc(activityId);

    try {
        // First, check if the activity document exists within the trip's subcollection.
        let activityDoc = await activityRef.get();
        if (!activityDoc.exists) {
            // If not, it's a local activity. We need to copy it into the trip's subcollection.
            const localActivityDoc = await firestore.collection('activities').doc(activityId).get();
            if (!localActivityDoc.exists) throw new Error("Activity not found in local or trip collection.");
            
            const activityToCreate = localActivityDoc.data() as Activity;
            const newActivityData = { ...activityToCreate, votes: {}, likes: 0, dislikes: 0 };
            await activityRef.set(newActivityData);
        }

        // Use a transaction to safely update vote counts.
        await firestore.runTransaction(async (transaction) => {
            const docForUpdate = await transaction.get(activityRef);
            if (!docForUpdate.exists) throw new Error("Activity does not exist in trip collection.");

            const data = docForUpdate.data()!;
            const votes = data.votes || {};
            const previousVote = votes[userId];

            if (previousVote === vote) return; // No change needed.

            let likesIncrement = 0;
            let dislikesIncrement = 0;

            if (previousVote === undefined) { // New vote
                if (vote) likesIncrement = 1; else dislikesIncrement = 1;
            } else { // Changing vote
                if (vote) { likesIncrement = 1; dislikesIncrement = -1; } 
                else { likesIncrement = -1; dislikesIncrement = 1; }
            }
            
            transaction.update(activityRef, {
                [`votes.${userId}`]: vote,
                likes: FieldValue.increment(likesIncrement),
                dislikes: FieldValue.increment(dislikesIncrement)
            });
        });

        // Fetch the final state of the document to return.
        const updatedDoc = await activityRef.get();
        const updatedData = updatedDoc.data()!;
        const updatedActivity: Activity = {
            ...(updatedData as Omit<Activity, 'id'>),
            id: updatedDoc.id,
            isLiked: updatedData.votes?.[userId],
        };

        revalidatePath(`/trips/${tripId}`, 'layout');
        return { success: true, updatedActivity };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error casting vote for activity ${activityId}:`, errorMessage);
        return { success: false, error: 'Failed to cast vote.' };
    }
}

/**
 * Fetches all trips for a user that have already been completed (end date is in the past).
 * @param userId - The UID of the user.
 * @returns A promise resolving to an array of Trip objects.
 */
export async function getCompletedTripsForUser(userId: string): Promise<Trip[]> {
  if (!isFirebaseInitialized) return [];
  try {
    const today = new Date().toISOString().split('T')[0];
    const tripsSnapshot = await firestore.collection('trips').where('ownerId', '==', userId).where('endDate', '<', today).get();
    return tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
  } catch (error) {
    return [];
  }
}

// =================================================================================
// --- Itinerary Actions ---
// =================================================================================

/**
 * Saves or overwrites the entire itinerary for a trip.
 * @param tripId - The ID of the trip.
 * @param itinerary - The full Itinerary object to save.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function saveItinerary(tripId: string, itinerary: Itinerary): Promise<{ success: boolean; error?: string }> {
    try {
        await firestore.collection('trips').doc(tripId).collection('itineraries').doc('default').set(itinerary);
        revalidatePath(`/trips/${tripId}`);
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Retrieves the saved itinerary for a trip.
 * @param tripId - The ID of the trip.
 * @returns A promise resolving to the Itinerary object or null if it doesn't exist.
 */
export async function getItinerary(tripId: string): Promise<Itinerary | null> {
    try {
        const doc = await firestore.collection('trips').doc(tripId).collection('itineraries').doc('default').get();
        if (!doc.exists) return null;
        return doc.data() as Itinerary;
    } catch (error) {
        return null;
    }
}

/**
 * Adds a single activity to a specific day in an existing itinerary.
 * @param tripId - The ID of the trip.
 * @param activity - The activity object to add.
 * @param date - The date string (YYYY-MM-DD) of the day to add the activity to.
 * @returns A promise resolving to an object indicating success or an error.
 */
export async function addActivityToItineraryDay(tripId: string, activity: Activity, date: string): Promise<{ success: boolean; error?: string }> {
    try {
        const currentItinerary = await getItinerary(tripId);
        if (!currentItinerary) return { success: false, error: "No itinerary found. Please generate one first." };

        const newItinerary: Itinerary = JSON.parse(JSON.stringify(currentItinerary));
        const dayIndex = newItinerary.days.findIndex(d => d.date === date);
        if (dayIndex === -1) return { success: false, error: "The selected day does not exist in the itinerary." };
        
        newItinerary.days[dayIndex].activities.push(activity);
        
        await saveItinerary(tripId, newItinerary);

        revalidatePath(`/trips/${tripId}`, 'layout');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

// =================================================================================
// --- Admin & Utility Actions ---
// =================================================================================

/**
 * Helper function to recursively delete all documents in a collection/subcollection in batches.
 * @param query - The Firestore query for the documents to delete.
 * @param resolve - The promise resolve function.
 * @param reject - The promise reject function.
 * @param deletedCount - The running total of deleted documents.
 */
async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (count: number) => void, reject: (reason?: any) => void, deletedCount: number = 0) {
    try {
        const snapshot = await query.get();
        if (snapshot.size === 0) {
            resolve(deletedCount);
            return;
        }

        const batch = firestore.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        deletedCount += snapshot.size;

        process.nextTick(() => {
            deleteQueryBatch(query, resolve, reject, deletedCount);
        });
    } catch(error) {
        reject(error);
    }
}

/**
 * Clears local discovery activities from the database. Can target a specific city or all cities.
 * @param city - Optional city name to clear. If omitted, all local activities and votes are cleared.
 * @returns A promise resolving to an object with the total count of deleted documents.
 */
export async function clearLocalActivities(city?: string): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    if (!isFirebaseInitialized) {
        return { success: false, error: 'Firebase is not initialized. Cannot clear data.' };
    }

    try {
        let totalDeleted = 0;

        let query: FirebaseFirestore.Query = firestore.collection('activities');
        if (city) {
            query = query.where('location', '==', city);
        }
        
        const count = await new Promise<number>((resolve, reject) => deleteQueryBatch(query.limit(500), resolve, reject));
        totalDeleted += count;
        
        // If clearing all cities, also clear user votes.
        if (!city) {
            const usersSnapshot = await firestore.collection('users').get();
            for (const userDoc of usersSnapshot.docs) {
                const votesQuery = userDoc.ref.collection('couplesVotes').limit(500);
                const completedQuery = userDoc.ref.collection('completedCouplesActivities').limit(500);
                const [votesCount, completedCount] = await Promise.all([
                     new Promise<number>((resolve, reject) => deleteQueryBatch(votesQuery, resolve, reject)),
                     new Promise<number>((resolve, reject) => deleteQueryBatch(completedQuery, resolve, reject)),
                ]);
                totalDeleted += votesCount + completedCount;
            }
        }
        
        revalidatePath('/plando-couples', 'layout');
        revalidatePath('/plando-friends', 'layout');
        revalidatePath('/plando-meet', 'layout');
        
        return { success: true, deletedCount: totalDeleted };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error('Error clearing local activities:', error);
        return { success: false, error: `Failed to clear data: ${errorMessage}` };
    }
}


/**
 * Admin action to clear all trip data from the database.
 * @returns A promise resolving to an object with the total count of deleted documents.
 */
export async function clearAllTrips(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    if (!isFirebaseInitialized) {
        return { success: false, error: 'Firebase is not initialized. Cannot clear data.' };
    }
    
    let totalDeleted = 0;
    try {
        const tripsSnapshot = await firestore.collection('trips').get();
        for (const tripDoc of tripsSnapshot.docs) {
            const activitiesQuery = tripDoc.ref.collection('activities').limit(500);
            const itinerariesQuery = tripDoc.ref.collection('itineraries').limit(500);

            const [activitiesCount, itinerariesCount] = await Promise.all([
                 new Promise<number>((resolve, reject) => deleteQueryBatch(activitiesQuery, resolve, reject)),
                 new Promise<number>((resolve, reject) => deleteQueryBatch(itinerariesQuery, resolve, reject)),
            ]);

            await tripDoc.ref.delete();
            totalDeleted += 1 + activitiesCount + itinerariesCount;
        }

        revalidatePath('/trips', 'layout');

        return { success: true, deletedCount: totalDeleted };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error('Error clearing all data:', error);
        return { success: false, error: `Failed to clear data: ${errorMessage}` };
    }
}
