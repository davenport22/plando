

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserProfile extends User {
  bio: string;
  location: string; // The user's home city, e.g., "Vienna, Austria". This is used to suggest local activities.
  memberSince: string;
  interests: string[];
  avatarUrl?: string;
  partnerId?: string;
}

export type ItineraryGenerationRule = 'majority' | 'all';

export interface Trip {
  id: string;
  name: string;
  destination: string; // The destination city for the trip, e.g., "Paris, France"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  ownerId: string;
  participantIds: string[];
  participants: UserProfile[]; // Will be populated for detailed views
  invitedEmails?: string[]; // To show pending invitations
  imageUrl?: string; // Main trip image
  itineraryGenerationRule?: ItineraryGenerationRule;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  syncLocalActivities?: boolean; // New flag to control syncing
}

export interface Activity {
  id: string;
  tripId?: string;
  name: string;
  description?: string;
  location: string; // The location of the activity, typically within the trip's destination city.
  duration: number; // in hours
  isLiked?: boolean; // This is for the CURRENT user's vote status
  imageUrls: string[];
  category?: 'Must Do' | 'Recommended' | 'Optional';
  startTime?: string; // HH:mm
  likes: number;
  dislikes: number;
  // Fields that can be enhanced by AI
  suggestedDurationHours?: number;
  bestTimeToVisit?: string;
  estimatedPriceRange?: string;
  address?: string;
  dataAiHint?: string; 
  createdBy?: string;
  votes?: { [userId: string]: boolean }; // Stored in DB, used to calculate likes/dislikes
  modules?: ('couples' | 'friends' | 'meet' | 'travel')[]; // An activity can belong to multiple modules
}

// For AI Flow input
export interface ActivityInput {
  name: string;
  duration: number;
  location: string;
  isLiked: boolean;
}

export interface ItineraryDay {
  date: string; // YYYY-MM-DD
  activities: Activity[];
}

export interface Itinerary {
  tripId: string;
  days: ItineraryDay[];
}

// For Plando Couples Matches
export interface MatchedActivity extends Activity {
  matchedDate: string; 
  partnerAlsoLiked: boolean; 
}

export interface CompletedActivity extends Activity {
  completedDate: string; // ISO string
}


declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    dataAiHint?: string;
  }
}
