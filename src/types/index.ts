
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
  likes?: number; 
  dislikes?: number; 
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
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
    latitude: 35.6895,
    longitude: 139.6917,
    placeId: 'ChIJXSModoWLGGARILWiCfeuYSo',
  },
];

export const MOCK_SUGGESTED_ACTIVITIES_PARIS: Activity[] = [
  { 
    id: 'activity-paris-1', 
    name: 'Eiffel Tower Visit', 
    location: 'Eiffel Tower, Champ de Mars', 
    duration: 2.5, 
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80', 
    description: 'Ascend the iconic Eiffel Tower for breathtaking panoramic views of Paris.' 
  },
  { 
    id: 'activity-paris-2', 
    name: 'Louvre Museum Tour', 
    location: 'Louvre Museum, Rue de Rivoli', 
    duration: 4, 
    imageUrl: 'https://images.unsplash.com/photo-1587648415693-4a5362b2ce41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsb3V2cmV8ZW58MHx8fHwxNzUwMzQ0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Explore world-renowned art collections, including the Mona Lisa and Venus de Milo.' 
  },
  { 
    id: 'activity-paris-3', 
    name: 'Seine River Cruise', 
    location: 'Seine River Banks', 
    duration: 1.5, 
    imageUrl: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
    description: 'Enjoy a relaxing boat tour along the Seine, passing famous landmarks.' 
  },
  { 
    id: 'activity-paris-4', 
    name: 'Montmartre & Sacré-Cœur', 
    location: 'Montmartre District', 
    duration: 3, 
    imageUrl: 'https://images.unsplash.com/photo-1569229074200-158480730801?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
    description: 'Discover the artistic charm of Montmartre and visit the stunning Sacré-Cœur Basilica.' 
  },
];

export const MOCK_SUGGESTED_ACTIVITIES_TOKYO: Activity[] = [
  {
    id: 'activity-tokyo-1',
    name: 'Shibuya Crossing Experience',
    location: 'Shibuya Scramble Crossing',
    duration: 1.5,
    imageUrl: 'https://images.unsplash.com/photo-1532236234562-0141e5a29a20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
    description: 'Witness the iconic organized chaos of the world\'s busiest pedestrian crossing.'
  },
  {
    id: 'activity-tokyo-2',
    name: 'Senso-ji Temple Visit',
    location: 'Asakusa',
    duration: 2,
    imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
    description: 'Explore Tokyo\'s oldest temple, a vibrant cultural and spiritual hub.'
  },
  {
    id: 'activity-tokyo-3',
    name: 'Tokyo Skytree Views',
    location: 'Tokyo Skytree',
    duration: 2.5,
    imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
    description: 'Get stunning panoramic views of Tokyo from one of the world\'s tallest towers.'
  },
  {
    id: 'activity-tokyo-4',
    name: 'Tsukiji Outer Market Food Tour',
    location: 'Tsukiji Outer Market',
    duration: 3,
    imageUrl: 'https://images.unsplash.com/photo-1573969708938-370990395aa0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
    description: 'Indulge in fresh seafood and local delicacies at this bustling market.'
  }
];

export const MOCK_DESTINATION_ACTIVITIES: Record<string, Activity[]> = {
  "Paris, France": MOCK_SUGGESTED_ACTIVITIES_PARIS,
  "Tokyo, Japan": MOCK_SUGGESTED_ACTIVITIES_TOKYO,
};


    
