

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ConnectionRequest {
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  type: 'partner' | 'friend';
  status: 'pending';
  createdAt: string; // ISO String
}

export interface UserProfile extends User {
  bio: string;
  location: string;
  memberSince: string;
  interests: string[];
  avatarUrl?: string;
  
  // Plando Couples
  partnerId?: string;
  partnerRequest?: ConnectionRequest | null; // Incoming request
  sentPartnerRequest?: ConnectionRequest | null; // Outgoing request

  // Plando Friends
  friendIds?: string[];
  activeFriendId?: string;
  friendRequests?: ConnectionRequest[]; // Incoming requests
  sentFriendRequests?: ConnectionRequest[]; // Outgoing requests
}

export type ItineraryGenerationRule = 'majority' | 'all';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  ownerId: string;
  participantIds: string[];
  participants: UserProfile[]; // Will be populated for detailed views
  invitedEmails?: string[];
  imageUrl?: string;
  itineraryGenerationRule?: ItineraryGenerationRule;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  syncLocalActivities?: boolean;
}

export interface Activity {
  id: string;
  tripId?: string;
  name: string;
  description?: string;
  location: string;
  duration: number; // in hours
  isLiked?: boolean;
  imageUrls: string[];
  category?: 'Must Do' | 'Recommended' | 'Optional';
  startTime?: string; // HH:mm
  likes: number;
  dislikes: number;
  suggestedDurationHours?: number;
  bestTimeToVisit?: string;
  estimatedPriceRange?: string;
  address?: string;
  dataAiHint?: string; 
  createdBy?: string;
  votes?: { [userId: string]: boolean };
  modules?: ('couples' | 'friends' | 'meet' | 'travel')[];
}

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
