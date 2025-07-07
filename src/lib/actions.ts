
'use server';

import { generateSuggestedItinerary, type GenerateSuggestedItineraryInput, type GenerateSuggestedItineraryOutput } from '@/ai/flows/generate-suggested-itinerary';
import { generateActivityDescription, type GenerateActivityDescriptionInput, type GenerateActivityDescriptionOutput } from '@/ai/flows/generate-activity-description-flow';
import { generateDestinationImage } from '@/ai/flows/generate-destination-image-flow';
import { generateInvitationEmail } from '@/ai/flows/generate-invitation-email-flow';
import { sendEmail } from '@/lib/emailService';
import { type ActivityInput, type Trip, type UserProfile, MOCK_USER_PROFILE, ALL_MOCK_USERS, type Activity, type Itinerary } from '@/types';
import { firestore, isFirebaseInitialized } from '@/lib/firebase';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';

const handleAIError = (error: unknown, defaultMessage: string): { error: string } => {
    console.error(defaultMessage, error);
    if (error instanceof Error) {
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

// Type for data coming from the NewTripForm
const NewTripDataSchema = z.object({
    name: z.string(),
    destination: z.string(),
    startDate: z.string(), // YYYY-MM-DD format
    endDate: z.string(),   // YYYY-MM-DD format
});


export async function createTrip(data: z.infer<typeof NewTripDataSchema>, ownerId: string): Promise<{ success: boolean; tripId?: string; error?: string }> {
    if (!isFirebaseInitialized) {
        return { success: false, error: 'Firebase is not initialized. Please check server credentials in .env file.' };
    }

    try {
        const validatedData = NewTripDataSchema.parse(data);
        
        let generatedImageUrl: string | null = null;
        try {
            generatedImageUrl = await generateDestinationImage({ destination: validatedData.destination });
        } catch(aiError) {
             console.warn("AI Image generation failed during trip creation, but proceeding with placeholder.", aiError);
        }
        
        const newTripData = {
            ...validatedData,
            ownerId: ownerId, 
            participantIds: [ownerId],
            imageUrl: generatedImageUrl || `https://placehold.co/600x400.png`,
        };

        const docRef = await firestore.collection('trips').add(newTripData);
        revalidatePath('/trips');
        return { success: true, tripId: docRef.id };

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
            try {
                const generatedImageUrl = await generateDestinationImage({ destination: destinationForImage });
                if (generatedImageUrl) {
                    updatedData.imageUrl = generatedImageUrl;
                }
            } catch (aiError) {
                console.warn("AI Image generation failed during trip update, but other data will be saved.", aiError);
            }
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
        
        if (userToAdd) {
            const tripRef = firestore.collection('trips').doc(tripId);
            const tripDoc = await tripRef.get();
    
            if (!tripDoc.exists) return { success: false, error: "Trip not found." };
    
            const tripData = tripDoc.data() as Trip;
            if (tripData.participantIds.includes(userToAdd.id)) return { success: false, error: "This user is already a participant." };
    
            await tripRef.update({ participantIds: FieldValue.arrayUnion(userToAdd.id) });
    
            revalidatePath(`/trips/${tripId}`);
            return { success: true, message: `${userToAdd.name} has been added to the trip.` };
        } else {
            const tripDoc = await firestore.collection('trips').doc(tripId).get();
            if (!tripDoc.exists) return { success: false, error: "Trip not found." };
            
            const tripName = tripDoc.data()!.name;

            // Fire-and-forget background email generation
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
      return { profile: doc.data() as UserProfile, isNewUser: false };
    } else {
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

      // Add user to the trip they were invited to
      if (pendingTripId) {
        try {
            const tripRef = firestore.collection('trips').doc(pendingTripId);
            await tripRef.update({
                participantIds: FieldValue.arrayUnion(user.uid)
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
            return { success: false, error: `This user is already connected with another partner.` };
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

export async function addCustomCoupleActivity(
  userId: string,
  activityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'participants' | 'category' | 'startTime' | 'dataAiHint'>
): Promise<{ success: boolean; error?: string; activity?: Activity }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId) return { success: false, error: 'User ID is required.' };

  try {
    const newActivityRef = firestore.collection('couplesActivities').doc();
    const newActivity: Activity = {
      ...activityData,
      id: newActivityRef.id,
      imageUrls: [`https://placehold.co/400x250.png?text=${encodeURIComponent(activityData.name)}`],
      createdBy: userId,
    };

    await newActivityRef.set(newActivity);

    // Automatically "like" the activity for the creator
    await saveCoupleVote(userId, newActivity.id, true);

    revalidatePath('/plando-couples');

    return { success: true, activity: newActivity };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to add custom date idea: ${errorMessage}` };
  }
}

export async function getCustomCouplesActivities(): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const snapshot = await firestore.collection('couplesActivities').get();
        return snapshot.docs.map(doc => doc.data() as Activity);
    } catch (error) {
        console.error('Error fetching custom couples activities:', error);
        return [];
    }
}

export async function addCustomFriendActivity(
  userId: string,
  activityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'participants' | 'category' | 'startTime' | 'dataAiHint'>
): Promise<{ success: boolean; error?: string; activity?: Activity }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId) return { success: false, error: 'User ID is required.' };

  try {
    const newActivityRef = firestore.collection('friendsActivities').doc();
    const newActivity: Activity = {
      ...activityData,
      id: newActivityRef.id,
      imageUrls: [`https://placehold.co/400x250.png?text=${encodeURIComponent(activityData.name)}`],
      createdBy: userId,
    };

    await newActivityRef.set(newActivity);
    
    revalidatePath('/plando-friends');

    return { success: true, activity: newActivity };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to add custom friend activity: ${errorMessage}` };
  }
}

export async function getCustomFriendActivities(): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const snapshot = await firestore.collection('friendsActivities').get();
        return snapshot.docs.map(doc => doc.data() as Activity);
    } catch (error) {
        console.error('Error fetching custom friend activities:', error);
        return [];
    }
}

export async function addCustomMeetActivity(
  userId: string,
  activityData: Omit<Activity, 'id' | 'isLiked' | 'tripId' | 'imageUrls' | 'likes' | 'dislikes' | 'participants' | 'category' | 'startTime' | 'dataAiHint'>
): Promise<{ success: boolean; error?: string; activity?: Activity }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId) return { success: false, error: 'User ID is required.' };

  try {
    const newActivityRef = firestore.collection('meetActivities').doc();
    const newActivity: Activity = {
      ...activityData,
      id: newActivityRef.id,
      imageUrls: [`https://placehold.co/400x250.png?text=${encodeURIComponent(activityData.name)}`],
      createdBy: userId,
    };

    await newActivityRef.set(newActivity);
    
    revalidatePath('/plando-meet');

    return { success: true, activity: newActivity };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to add custom meet activity: ${errorMessage}` };
  }
}

export async function getCustomMeetActivities(): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const snapshot = await firestore.collection('meetActivities').get();
        return snapshot.docs.map(doc => doc.data() as Activity);
    } catch (error) {
        console.error('Error fetching custom meet activities:', error);
        return [];
    }
}

export async function markCoupleActivityAsCompleted(
  userId: string,
  partnerId: string,
  activityId: string,
  wouldDoAgain: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.' };
  if (!userId || !partnerId || !activityId) {
    return { success: false, error: 'Missing required IDs to complete this action.' };
  }

  try {
    const batch = firestore.batch();
    
    // If the couple wants to see this activity again in the future,
    // we delete their 'like' votes. This makes the activity eligible
    // to reappear in their swiping deck.
    if (wouldDoAgain) {
      const userVoteRef = firestore.collection('users').doc(userId).collection('couplesVotes').doc(activityId);
      const partnerVoteRef = firestore.collection('users').doc(partnerId).collection('couplesVotes').doc(activityId);
      batch.delete(userVoteRef);
      batch.delete(partnerVoteRef);
    }
    
    // If wouldDoAgain is false, we do nothing on the backend.
    // The client will remove it from the matched list, but the 'like' votes
    // remain in the database, preventing it from being shown in the swiping deck again.

    await batch.commit();

    // Revalidate the matches page path
    revalidatePath('/plando-couples/matches');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Failed to mark activity ${activityId} as done for couple ${userId}/${partnerId}:`, error);
    return { success: false, error: `Failed to update activity status: ${errorMessage}` };
  }
}

// --- Trip Activities Actions ---

export async function getTripActivities(tripId: string): Promise<Activity[]> {
    if (!isFirebaseInitialized) return [];
    try {
        const activitiesSnapshot = await firestore.collection('trips').doc(tripId).collection('activities').get();
        const activities = activitiesSnapshot.docs.map(doc => {
            const data = doc.data();
            // This ensures every activity has a proper ID from the database, fixing the original bug.
            return { ...data, id: doc.id } as Activity;
        });
        return activities;
    } catch (error) {
        console.error(`Error getting trip activities for trip ${tripId}:`, error)
        return [];
    }
}

export async function addTripActivity(tripId: string, activityData: Omit<Activity, 'id'>): Promise<{ success: boolean; activityId?: string; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.'};
    try {
        // Ensure the ID is not part of the data being added
        const { id, ...data } = activityData as any;
        const docRef = await firestore.collection('trips').doc(tripId).collection('activities').add(data);
        revalidatePath(`/trips/${tripId}`);
        return { success: true, activityId: docRef.id };
    } catch (error) {
        return { success: false, error: 'Failed to add activity.' };
    }
}

export async function updateTripActivity(tripId: string, activityId: string, data: Partial<Activity>): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseInitialized) return { success: false, error: 'Backend not configured.'};
    try {
        await firestore.collection('trips').doc(tripId).collection('activities').doc(activityId).update(data);
        revalidatePath(`/trips/${tripId}`);
        revalidatePath(`/trips/${tripId}/liked`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update activity.' };
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
        
        // This is the corrected logic.
        // We push the activity to the itinerary without changing its original vote status.
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
