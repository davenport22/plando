
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserProfile extends User {
  bio: string;
  location: string;
  memberSince: string;
  interests: string[];
  avatarUrl?: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  ownerId: string;
  participantIds: string[];
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface Activity {
  id: string;
  tripId?: string; // Optional if it's a generic activity template before being added to itinerary
  name: string;
  description?: string;
  location: string;
  duration: number; // in hours
  isLiked?: boolean;
  imageUrl?: string;
  category?: 'Must Do' | 'Recommended' | 'Optional';
  startTime?: string; // HH:mm
  likes?: number; // Number of likes
  dislikes?: number; // Number of dislikes
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

// Mocked Data
export const MOCK_USER: User = {
  id: 'user1',
  name: 'Alex Traveler',
  email: 'alex@example.com',
};

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'user1',
  name: 'David Schneiderbauer',
  email: 'david.m.schneiderbauer@gmail.com',
  bio: 'Travel enthusiast exploring the world one trip at a time. Loves photography and local cuisines.',
  location: 'Vienna, Austria',
  memberSince: 'May 2023', // Changed to a past date for realism
  interests: ['Outdoors', 'Adventure Sports', 'Mountains', 'Beach', 'Cities', 'Wildlife', 'Hiking', 'Photography', 'Foodie', 'Culture'],
  avatarUrl: 'https://firebasestudio-hosting.intern.goog/images/prototyper/david_schneiderbauer.png',
};

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip1',
    name: 'Paris Adventure',
    destination: 'Paris, France',
    startDate: '2024-09-10',
    endDate: '2024-09-17',
    ownerId: 'user1',
    participantIds: ['user1', 'user2'],
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwYXJpc3xlbnwwfHx8fDE3NTAyNzQzMTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    latitude: 48.8566,
    longitude: 2.3522,
    placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
  },
  {
    id: 'trip2',
    name: 'Tokyo Exploration',
    destination: 'Tokyo, Japan',
    startDate: '2024-11-05',
    endDate: '2024-11-15',
    ownerId: 'user2',
    participantIds: ['user1', 'user2'],
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx0b2t5b3xlbnwwfHx8fDE3NTAzMTQwNDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    latitude: 35.6895,
    longitude: 139.6917,
    placeId: 'ChIJXSModoWLGGARILWiCfeuYSo',
  },
];

export const MOCK_SUGGESTED_ACTIVITIES_PARIS: Activity[] = [
  { id: 'activity1', name: 'Eiffel Tower Visit', location: 'Eiffel Tower', duration: 2, imageUrl: 'https://placehold.co/300x200.png', description: 'Iconic landmark offering breathtaking city views.' },
  { id: 'activity2', name: 'Louvre Museum Tour', location: 'Louvre Museum', duration: 4, imageUrl: 'https://placehold.co/300x200.png', description: 'Home to masterpieces like the Mona Lisa.' },
  { id: 'activity3', name: 'Seine River Cruise', location: 'Seine River', duration: 1.5, imageUrl: 'https://placehold.co/300x200.png', description: 'Relaxing cruise with stunning Parisian sights.' },
  { id: 'activity4', name: 'Montmartre Exploration', location: 'Montmartre', duration: 3, imageUrl: 'https://placehold.co/300x200.png', description: 'Artistic neighborhood with Sacré-Cœur Basilica.' },
];
