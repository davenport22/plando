
'use server';

import { generateSuggestedItinerary, type GenerateSuggestedItineraryInput, type GenerateSuggestedItineraryOutput } from '@/ai/flows/generate-suggested-itinerary';
import { generateActivityDescription, type GenerateActivityDescriptionInput, type GenerateActivityDescriptionOutput } from '@/ai/flows/generate-activity-description-flow';
import { generateDestinationImage } from '@/ai/flows/generate-destination-image-flow';
import { generateInvitationEmail } from '@/ai/flows/generate-invitation-email-flow';
import { extractActivityDetailsFromUrl, type ExtractActivityDetailsFromUrlOutput } from '@/ai/flows/extract-activity-details-from-url-flow';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';
import { sendEmail } from '@/lib/emailService';
import { type ActivityInput, type Trip, type UserProfile, type Activity, type Itinerary, ItineraryGenerationRule, type CompletedActivity } from '@/types';
import { firestore, isFirebaseInitialized } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';


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

// A fallback SVG icon for custom activities if AI image generation fails.
const customActivityFallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
  <rect width="100%" height="100%" fill="#f0f8ff" />
  <g transform="translate(175, 100)" stroke="#a9a9a9" stroke-width="12" stroke-linecap="round">
    <line x1="0" y1="25" x2="50" y2="25" />
    <line x1="25" y1="0" x2="25" y2="50" />
  </g>
</svg>`;
const customActivityFallbackImageUrl = `data:image/svg+xml;base64,${Buffer.from(customActivityFallbackSvg).toString('base64')}`;


// This function will be called from client components to generate the itinerary.
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
    
    const qualifiedActivities = allActivities.filter(act => {
        if (act.likes === 0) return false;

        if (rule === 'all') {
            // All participants must have liked it. This implies everyone voted.
            return act.likes === numParticipants;
        } else { // majority
            // Of those who voted, a simple majority must have liked it.
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

    const result = await generateActivityDescription(input);

    if (!result || !result.description) {
      return { error: "Failed to generate enhanced description: AI returned invalid data." };
    }
    return result;

  } catch (error) {
    return handleAIError(error, "Failed to generate enhanced description");
  }
}

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

// Type for data coming from the NewTripForm
const NewTripDataSchema = z.object({
    name: z.string(),
    destination: z.string(),
    startDate: z.string(), // YYYY-MM-DD format
    endDate: z.string(),   // YYYY-MM-DD format
    itineraryGenerationRule: z.enum(['majority', 'all']),
    participantEmails: z.array(z.string().email()).optional(),
    syncLocalActivities: z.boolean().optional(),
});


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

        const participantIds = new Set<string>([ownerId]);
        const emailsToInvite: string[] = [];

        for (const email of participantEmails) {
            if (email.toLowerCase() === ownerProfile.email.toLowerCase()) {
                continue;
            }
            const userToAdd = await findUserByEmail(email);
            if (userToAdd) {
                participantIds.add(userToAdd.id);
            } else {
                emailsToInvite.push(email);
            }
        }
        
        const imageUrl = await generateDestinationImage({ destination: tripDetails.destination });

        const newTripData = {
            ...tripDetails,
            ownerId: ownerId, 
            participantIds: Array.from(participantIds),
            invitedEmails: emailsToInvite,
            imageUrl: imageUrl,
        };

        const docRef = await firestore.collection('trips').add(newTripData);
        const tripId = docRef.id;

        // Fire-and-forget invitations after trip is created
        if (emailsToInvite.length > 0) {
            emailsToInvite.forEach(email => {
                generateInvitationEmail({
                    recipientEmail: email,
                    tripName: tripDetails.name,
                    inviterName: ownerProfile.name,
                    tripId: tripId,
                }).then(emailContent => {
                    sendEmail({ to: email, subject: emailContent.subject, html: emailContent.body });
                }).catch(genError => {
                    const aiError = handleAIError(genError, "Failed to generate invitation email");
                    console.error(`Background email generation failed for ${email}: ${aiError.error}`);
                });
            });
        }

        revalidatePath('/trips');
        revalidatePath(`/trips/${tripId}`);
        return { success: true, tripId: tripId };

    } catch (e) {
        console.error('Error creating trip:', e);
        if (e instanceof Error && (e.message.includes("API") || e.message.includes("permission"))) {
            return { success: false, ...handleAIError(e, "Could not create trip due to an AI service error.") };
        }
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        return { success: false, error: `Failed to create trip: ${errorMessage}` };
    }
}

export async function getTrip(tripId: string): Promise<Trip | null> {
    try {
        const tripDoc = await firestore.collection('trips').doc(tripId).get();
        if (!tripDoc.exists) {
            return null;
        }
        const data = tripDoc.data()!;

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

export async function getTripsForUser(userId: string): Promise<{ success: boolean; trips?: Trip[]; error?: string }> {
    if (!isFirebaseInitialized) {
        try {
            const { firestore } = await import('@/lib/firebase');
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


export async function updateTrip(tripId: string, data: Partial<Trip>): Promise<{ success: boolean; error?: string }> {
    try {
        if (!tripId) {
            return { success: false, error: "Trip ID is required." };
        }
        
        const tripRef = firestore.collection('trips').doc(tripId);
        const currentTripDoc = await tripRef.get();
        if (!currentTripDoc.exists) {
            return { success: false, error: "Trip not found." };
        }
        const currentTripData = currentTripDoc.data() as Trip;

        const updatedData = { ...data };

        const destinationChanged = data.destination && data.destination !== currentTripData.destination;
        const imageUrlMissingOrPlaceholder = !currentTripData.imageUrl || currentTripData.imageUrl.includes('placehold.co');

        if (destinationChanged || imageUrlMissingOrPlaceholder) {
             const destinationForImage = data.destination || currentTripData.destination;
            updatedData.imageUrl = await generateDestinationImage({ destination: destinationForImage });
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

export async function addParticipantToTrip(tripId: string, email: string, inviterName: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
        if (!email.trim() || !z.string().email().safeParse(email.trim()).success) {
            return { success: false, error: "Please enter a valid email address." };
        }
        
        const userToAdd = await findUserByEmail(email);
        const tripRef = firestore.collection('trips').doc(tripId);
        
        if (userToAdd) {
            const tripDoc = await tripRef.get();
            if (!tripDoc.exists) return { success: false, error: "Trip not found." };
            const tripData = tripDoc.data() as Trip;
            if (tripData.participantIds.includes(userToAdd.id)) return { success: false, error: "This user is already a participant." };
    
            await tripRef.update({ 
                participantIds: FieldValue.arrayUnion(userToAdd.id),
                invitedEmails: FieldValue.arrayRemove(email) // Remove from invited list
            });
    
            revalidatePath(`/trips/${tripId}`);
            return { success: true, message: `${userToAdd.name} has been added to the trip.` };
        } else {
            const tripDoc = await tripRef.get();
            if (!tripDoc.exists) return { success: false, error: "Trip not found." };
            const tripData = tripDoc.data() as Trip;
            const tripName = tripData.name;

            if (tripData.invitedEmails?.includes(email)) {
                return { success: false, error: "This email has already been invited." };
            }

            // Add to invited list and send email
            await tripRef.update({ invitedEmails: FieldValue.arrayUnion(email) });

            generateInvitationEmail({
                recipientEmail: email,
                tripName: tripName,
                inviterName: inviterName,
                tripId: tripId,
            }).then(emailContent => {
                sendEmail({ to: email, subject: emailContent.subject, html: emailContent.body });
            }).catch(genError => {
                const aiError = handleAIError(genError, "Failed to generate invitation email");
                console.error(`Background email generation failed for ${email}: ${aiError.error}`);
            });

            revalidatePath(`/trips/${tripId}`);
            return { success: true, message: `User not found. An invitation is being sent to ${email}.` };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function removeParticipantFromTrip(tripId: string, participantId: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!tripId || !participantId) {
            return { success: false, error: "Trip ID and participant ID are required." };
        }

        const tripRef = firestore.collection('trips').doc(tripId);
        const tripDoc = await tripRef.get();

        if (!tripDoc.exists) return { success: false, error: "Trip not found." };

        const tripData = tripDoc.data() as Trip;
        if (tripData.ownerId === participantId) return { success: false, error: "The trip owner cannot be removed." };

        await tripRef.update({ participantIds: FieldValue.arrayRemove(participantId) });

        revalidatePath(`/trips/${tripId}`);
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function importLocalActivitiesToTrip(tripId: string): Promise<{ success: boolean; error?: string; count: number; }> {
    if (!isFirebaseInitialized) {
        return { success: false, error: 'Firebase is not initialized. Cannot import activities.', count: 0 };
    }

    try {
        const trip = await getTrip(tripId);
        if (!trip) {
            return { success: false, error: 'Trip not found.', count: 0 };
        }
        if (!trip.destination) {
            return { success: false, error: 'Trip has no destination set.', count: 0 };
        }
        
        const localActivities = await getCustomCouplesActivities(trip.destination);
        const tripActivities = await getTripActivities(tripId, trip.ownerId);

        const existingActivityNames = new Set(tripActivities.map(a => a.name));
        const newActivitiesToImport = localActivities.filter(a => !existingActivityNames.has(a.name));

        if (newActivitiesToImport.length === 0) {
            return { success: true, count: 0 };
        }
        
        const batch = firestore.batch();
        
        newActivitiesToImport.forEach(activity => {
            const newActivityRef = firestore.collection('trips').doc(tripId).collection('activities').doc();
            const { id, isLiked, ...activityData } = activity;
            const newTripActivity: Omit<Activity, 'id' | 'isLiked'> = {
                ...activityData,
                likes: 0,
                dislikes: 0,
                votes: {},
            };
            batch.set(newActivityRef, newTripActivity);
        });

        await batch.commit();

        revalidatePath(`/trips/${tripId}`);
        return { success: true, count: newActivitiesToImport.length };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage, count: 0 };
    }
}


export async function getOrCreateUserProfile(user: {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}, pendingTripId?: string | null): Promise<{ profile: UserProfile; isNewUser: boolean }> {
  try {
    if (!isFirebaseInitialized) {
      throw new Error('Server not configured. Please ensure Firebase credentials are in your .env file.');
    }
  
    const userRef = firestore.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (doc.exists) {
      const existingProfile = doc.data() as UserProfile;
      // If user logs in with Google after email, update their name and avatar if they are generic
      const updates: Partial<UserProfile> = {};
      if (user.name && existingProfile.name === 'New User') {
          updates.name = user.name;
      }
      if (user.photoURL && existingProfile.avatarUrl?.includes('avatar.vercel.sh')) {
          updates.avatarUrl = user.photoURL;
      }

      if (Object.keys(updates).length > 0) {
          await userRef.update(updates);
          const updatedProfile = { ...existingProfile, ...updates };
          return { profile: updatedProfile, isNewUser: false };
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

      // Add user to the trip they were invited to
      if (pendingTripId) {
        try {
            const tripRef = firestore.collection('trips').doc(pendingTripId);
            await tripRef.update({
                participantIds: FieldValue.arrayUnion(user.uid),
                invitedEmails: FieldValue.arrayRemove(user.email) // Remove from invited list
            });
            revalidatePath(`/trips/${pendingTripId}`);
        } catch (tripError) {
            console.error(`Failed to add new user ${user.uid} to trip ${pendingTripId} after registration.`, tripError);
            // Non-fatal error, user profile is created, but they might need to be added manually.
        }
      }

      return { profile: newUserProfile, isNewUser: true };
    }
  } catch (error: any) {
    console.error(`Error getting or creating profile for user ${user.uid}:`, error);
    if (error.code === 5 || (error.message && error.message.includes("NOT_FOUND"))) {
        const helpfulError = `The server connected to Firebase, but could not find the Firestore database. Please check your Firestore database location is set to 'europe-west1'.`;
        throw new Error(helpfulError);
    }
    throw new Error(error instanceof Error ? error.message : "An unknown database error occurred.");
  }
}

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
        
        revalidatePath('/profile');
        revalidatePath(`/profile/edit`);

        return { success: true, updatedProfile };

    } catch (error) {
        console.error(`Error updating profile for ${userId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}


export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
        const snapshot = await firestore.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error: any) {
        if (error.code === 5 || (error.message && error.message.includes("NOT_FOUND"))) return null;
        console.error(`An unexpected error occurred in findUserByEmail for "${email}":`, error);
        throw error;
    }
}

export async function connectPartner(currentUserId: string, partnerEmail: string): Promise<{ success: boolean; error?: string; partner?: UserProfile }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
    if (!currentUserId || !partnerEmail) return { success: false, error: 'User ID and partner email are required.' };

    try {
        const [currentUserProfile, partnerProfile] = await Promise.all([
            getUserProfile(currentUserId),
            findUserByEmail(partnerEmail)
        ]);
        
        if (!currentUserProfile) {
            return { success: false, error: "Your user profile could not be found." };
        }

        if (currentUserProfile.partnerId) {
            const currentPartner = await getUserProfile(currentUserProfile.partnerId);
            return { success: false, error: `You are already connected with ${currentPartner?.name || 'a partner'}. Please disconnect first.` };
        }
        
        if (!partnerProfile) {
            return { success: false, error: "Could not find a user with that email address." };
        }

        if (partnerProfile.id === currentUserId) {
            return { success: false, error: "You cannot connect with yourself." };
        }

        if (partnerProfile.partnerId) {
            const theirPartner = await getUserProfile(partnerProfile.partnerId);
            return { success: false, error: `${partnerProfile.name} is already connected with ${theirPartner?.name || 'someone'}.` };
        }
        
        const userRef = firestore.collection('users').doc(currentUserId);
        const partnerRef = firestore.collection('users').doc(partnerProfile.id);

        await userRef.update({ partnerId: partnerProfile.id });
        await partnerRef.update({ partnerId: currentUserId });

        revalidatePath('/plando-couples');
        
        return { success: true, partner: partnerProfile };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to connect partner: ${errorMessage}` };
    }
}


export async function disconnectPartner(currentUserId: string): Promise<{ success: boolean; error?: string }> {
     if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
     if (!currentUserId) return { success: false, error: 'User ID is required.' };
    
    try {
        const currentUserDoc = await firestore.collection('users').doc(currentUserId).get();
        if (!currentUserDoc.exists) {
            return { success: false, error: 'Current user not found.' };
        }

        const currentUserProfile = currentUserDoc.data() as UserProfile;
        const partnerId = currentUserProfile.partnerId;

        await firestore.collection('users').doc(currentUserId).update({
            partnerId: FieldValue.delete()
        });

        if (partnerId) {
            await firestore.collection('users').doc(partnerId).update({
                partnerId: FieldValue.delete()
            });
        }
        
        revalidatePath('/plando-couples');
        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Failed to disconnect partner: ${errorMessage}` };
    }
}

export async function saveCoupleVote(userId: string, activityId: string, liked: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        await firestore.collection('users').doc(userId).collection('couplesVotes').doc(activityId).set({ liked, votedAt: new Date().toISOString() });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to save your vote to the database.' };
    }
}

export async function getLikedCouplesActivityIds(userId: string): Promise<string[]> {
    try {
        const snapshot = await firestore.collection('users').doc(userId).collection('couplesVotes').where('liked', '==', true).get();
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        return [];
    }
}

export async function getVotedOnCouplesActivityIds(userId: string): Promise<string[]> {
    try {
        const snapshot = await firestore.collection('users').doc(userId).collection('couplesVotes').get();
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error(`Error fetching voted-on couples activity IDs for user ${userId}:`, error);
        return [];
    }
}

async function internal_addCustomLocalActivity(
  userId: string,
  module: 'couples' | 'friends' | 'meet',
  activityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'category' | 'startTime' | 'votes' | 'participants' | 'modules'>
): Promise<{ success: boolean; error?: string; activity?: Activity }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId) return { success: false, error: 'User ID is required.' };

  try {
    const newActivityRef = firestore.collection('activities').doc();
    
    let imageUrl = customActivityFallbackImageUrl;
    try {
        const generatedImage = await generateActivityImage({
            activityName: activityData.name,
            location: activityData.location,
            dataAiHint: activityData.dataAiHint,
        });
        if (generatedImage) {
            imageUrl = generatedImage;
        }
    } catch (aiError) {
        console.warn(`AI image generation failed for activity "${activityData.name}", falling back to placeholder.`, aiError);
    }

    const newActivity: Activity = {
      ...(activityData as Omit<Activity, 'id'>),
      id: newActivityRef.id,
      modules: [module],
      imageUrls: [imageUrl],
      createdBy: userId,
      likes: 0, 
      dislikes: 0,
    };

    await newActivityRef.set(newActivity);

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

export async function addCustomCoupleActivity(userId: string, data: any) { return internal_addCustomLocalActivity(userId, 'couples', data); }
export async function addCustomFriendActivity(userId: string, data: any) { return internal_addCustomLocalActivity(userId, 'friends', data); }
export async function addCustomMeetActivity(userId: string, data: any) { return internal_addCustomLocalActivity(userId, 'meet', data); }

async function internal_getCustomLocalActivities(module: 'couples' | 'friends' | 'meet', location: string, userId?: string, partnerId?: string): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const locationToQuery = location || "Vienna, Austria";

        const userIdsToQuery: string[] = ['system'];
        if (userId) userIdsToQuery.push(userId);
        
        // For couples module, we also want to see activities created by the partner.
        if (module === 'couples' && partnerId) {
            userIdsToQuery.push(partnerId);
        }

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

export async function getCustomCouplesActivities(location?: string, userId?: string, partnerId?: string) { return internal_getCustomLocalActivities('couples', location || "Vienna, Austria", userId, partnerId); }
export async function getCustomFriendActivities(location?: string, userId?: string) { return internal_getCustomLocalActivities('friends', location || "Vienna, Austria", userId); }
export async function getCustomMeetActivities(location?: string, userId?: string) { return internal_getCustomLocalActivities('meet', location || "Vienna, Austria", userId); }

export async function markCoupleActivityAsCompleted(
  userId: string,
  partnerId: string,
  activity: Activity,
  wouldDoAgain: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId || !partnerId || !activity || !activity.id) {
    return { success: false, error: 'Missing required IDs or activity data to complete this action.' };
  }

  try {
    const batch = firestore.batch();
    
    const completedActivityData: CompletedActivity = {
        ...activity,
        completedDate: new Date().toISOString()
    };
    
    const userCompletedRef = firestore.collection('users').doc(userId).collection('completedCouplesActivities').doc(activity.id);
    const partnerCompletedRef = firestore.collection('users').doc(partnerId).collection('completedCouplesActivities').doc(activity.id);

    batch.set(userCompletedRef, completedActivityData);
    batch.set(partnerCompletedRef, completedActivityData);
    
    if (wouldDoAgain) {
      const userVoteRef = firestore.collection('users').doc(userId).collection('couplesVotes').doc(activity.id);
      const partnerVoteRef = firestore.collection('users').doc(partnerId).collection('couplesVotes').doc(activity.id);
      batch.delete(userVoteRef);
      batch.delete(partnerVoteRef);
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

// --- Trip Activities Actions ---

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

        const tripActivitiesSnapshot = await firestore.collection('trips').doc(tripId).collection('activities').get();
        
        tripActivitiesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const votes = data.votes || {};
            const activity = { 
                ...data, 
                id: doc.id,
                likes: data.likes || 0,
                dislikes: data.dislikes || 0,
                isLiked: votes[userId],
            } as Activity;
            activitiesMap.set(doc.id, activity);
        });

        if (tripData.syncLocalActivities && tripData.destination) {
            const localActivitiesSnapshot = await firestore.collection('activities').where('location', '==', tripData.destination).get();
            
            localActivitiesSnapshot.docs.forEach(doc => {
                if (!activitiesMap.has(doc.id)) {
                     const localActivity = doc.data() as Activity;
                     activitiesMap.set(doc.id, {
                        ...localActivity,
                        id: doc.id,
                        tripId: tripId,
                        isLiked: undefined,
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


export async function addTripActivity(
  tripId: string,
  activityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'votes' | 'category' | 'startTime' | 'participants' | 'modules'>,
  creatorId: string
): Promise<{ success: boolean; newActivity?: Activity; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.'};
    try {
        const { id, ...data } = activityData as any;
        
        let imageUrl = customActivityFallbackImageUrl; 
        try {
            const generatedImage = await generateActivityImage({
                activityName: data.name,
                location: data.location,
                dataAiHint: data.dataAiHint,
            });
            if (generatedImage) {
                imageUrl = generatedImage;
            }
        } catch(aiError) {
             console.warn(`AI image generation failed for activity "${data.name}", falling back to placeholder.`, aiError);
        }

        const docRef = firestore.collection('trips').doc(tripId).collection('activities').doc();

        const newActivityPayload: Activity = {
            ...(data as Omit<Activity, 'id'>),
            id: docRef.id,
            imageUrls: [imageUrl],
            likes: 1, 
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


export async function voteOnTripActivity(
    tripId: string, 
    activityId: string, 
    userId: string, 
    vote: boolean
): Promise<{ success: boolean; error?: string; updatedActivity?: Activity }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };

    const activityRef = firestore.collection('trips').doc(tripId).collection('activities').doc(activityId);

    try {
        // Ensure the activity document exists in the trip's subcollection before trying to update it.
        let activityDoc = await activityRef.get();
        if (!activityDoc.exists) {
            const localActivityDoc = await firestore.collection('activities').doc(activityId).get();
            if (!localActivityDoc.exists) throw new Error("Activity not found in any local collection.");
            
            const activityToCreate = localActivityDoc.data() as Activity;
            
            // Create a new document in the trip's activities subcollection with default votes
            const newActivityData = { 
                ...activityToCreate, 
                votes: {}, 
                likes: 0, 
                dislikes: 0 
            };
            await activityRef.set(newActivityData);
        }

        // Now, perform the vote update in a transaction.
        await firestore.runTransaction(async (transaction) => {
            const docForUpdate = await transaction.get(activityRef);
            if (!docForUpdate.exists) throw new Error("Activity does not exist in trip collection.");

            const data = docForUpdate.data()!;
            const votes = data.votes || {};
            const previousVote = votes[userId];

            if (previousVote === vote) {
                return; // No change in vote, so we do nothing.
            }

            let likesIncrement = 0;
            let dislikesIncrement = 0;

            if (previousVote === undefined) {
                // This is a new vote.
                if (vote) likesIncrement = 1; else dislikesIncrement = 1;
            } else {
                // This is a flipped vote.
                if (vote) { // was false, now true
                    likesIncrement = 1;
                    dislikesIncrement = -1;
                } else { // was true, now false
                    likesIncrement = -1;
                    dislikesIncrement = 1;
                }
            }
            
            // Atomically update vote counts and the voter map.
            transaction.update(activityRef, {
                [`votes.${userId}`]: vote,
                likes: FieldValue.increment(likesIncrement),
                dislikes: FieldValue.increment(dislikesIncrement)
            });
        });

        // After the transaction, fetch the final state of the document.
        const updatedDoc = await activityRef.get();
        const updatedData = updatedDoc.data()!;
        const finalVotes = updatedData.votes || {};
        
        const updatedActivity: Activity = {
            ...(updatedData as Omit<Activity, 'id'>),
            id: updatedDoc.id,
            likes: updatedData.likes || 0,
            dislikes: updatedData.dislikes || 0,
            isLiked: finalVotes[userId],
        };

        revalidatePath(`/trips/${tripId}`);
        revalidatePath(`/trips/${tripId}/liked`);
        return { success: true, updatedActivity };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error(`Error casting vote for activity ${activityId}:`, errorMessage);
        return { success: false, error: 'Failed to cast vote.' };
    }
}


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

// --- Itinerary Actions ---

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

export async function getItinerary(tripId: string): Promise<Itinerary | null> {
    try {
        const doc = await firestore.collection('trips').doc(tripId).collection('itineraries').doc('default').get();
        if (!doc.exists) return null;
        return doc.data() as Itinerary;
    } catch (error) {
        return null;
    }
}

export async function addActivityToItineraryDay(tripId: string, activity: Activity, date: string): Promise<{ success: boolean; error?: string }> {
    try {
        const currentItinerary = await getItinerary(tripId);
        if (!currentItinerary) {
            return { success: false, error: "No itinerary found for this trip. Please generate one first." };
        }

        const newItinerary: Itinerary = JSON.parse(JSON.stringify(currentItinerary));
        const dayIndex = newItinerary.days.findIndex(d => d.date === date);

        if (dayIndex === -1) {
            return { success: false, error: "The selected day does not exist in the itinerary." };
        }
        
        newItinerary.days[dayIndex].activities.push(activity);
        
        await saveItinerary(tripId, newItinerary);

        revalidatePath(`/trips/${tripId}`);
        revalidatePath(`/trips/${tripId}/liked`);
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}


/**
 * Deletes all documents from a collection or subcollection in batches.
 * @param query The query for the collection/subcollection to delete.
 * @param batchSize The number of documents to delete in each batch.
 * @returns The total number of documents deleted.
 */
async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (count: number) => void, reject: (reason?: any) => void, deletedCount: number = 0) {
    try {
        const snapshot = await query.get();

        if (snapshot.size === 0) {
            resolve(deletedCount);
            return;
        }

        const batch = firestore.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        deletedCount += snapshot.size;

        if (snapshot.size > 0) {
            process.nextTick(() => {
                deleteQueryBatch(query, resolve, reject, deletedCount);
            });
        } else {
            resolve(deletedCount);
        }
    } catch(error) {
        reject(error);
    }
}

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
        console.log(`Cleared ${count} documents from the activities collection for city: ${city || 'all'}.`);
        
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
 * Server action to clear all trip data.
 */
export async function clearAllTrips(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    if (!isFirebaseInitialized) {
        return { success: false, error: 'Firebase is not initialized. Cannot clear data.' };
    }
    
    let totalDeleted = 0;
    try {
        const tripsSnapshot = await firestore.collection('trips').get();
        for (const tripDoc of tripsSnapshot.docs) {
            const tripId = tripDoc.id;
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
