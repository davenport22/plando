
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
  imageUrl?: string; // Main trip image
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface Activity {
  id: string;
  tripId?: string; 
  name: string;
  description?: string;
  location: string;
  duration: number; // in hours
  isLiked?: boolean;
  imageUrls: string[]; // Changed from imageUrl to imageUrls
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
  memberSince: 'May 2023',
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
    imageUrls: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1510125960040-a488747b040b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ], 
    description: 'Ascend the iconic Eiffel Tower for breathtaking panoramic views of Paris. Consider booking tickets in advance to skip long queues, especially during peak season. The evening light show is also a must-see.' 
  },
  { 
    id: 'activity-paris-2', 
    name: 'Louvre Museum Tour', 
    location: 'Louvre Museum, Rue de Rivoli', 
    duration: 4, 
    imageUrls: [
      'https://images.unsplash.com/photo-1587648415693-4a5362b2ce41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsb3V2cmV8ZW58MHx8fHwxNzUwMzQ0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1590101152024-1a0792027179?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Explore world-renowned art collections, including the Mona Lisa and Venus de Milo. The museum is vast; plan your visit to focus on specific wings or masterpieces to make the most of your time.' 
  },
  { 
    id: 'activity-paris-3', 
    name: 'Seine River Cruise', 
    location: 'Seine River Banks', 
    duration: 1.5, 
    imageUrls: [
      'https://images.unsplash.com/photo-1504896287989-ff1fbde00199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzZWluZSUyMHJpdmVyfGVufDB8fHx8MTc1MDM0NDkwOXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1558380733-e6a30704f782?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Enjoy a relaxing boat tour along the Seine, passing famous landmarks like Notre Dame Cathedral, Musée d\'Orsay, and the Louvre. Evening cruises offer a magical view of the illuminated city.' 
  },
  { 
    id: 'activity-paris-4', 
    name: 'Montmartre & Sacré-Cœur', 
    location: 'Montmartre District', 
    duration: 3, 
    imageUrls: [
      'https://images.unsplash.com/photo-1702375308488-de52189a0ff3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxtb250bWFydHJlJTIwc2FjcmV8ZW58MHx8fHwxNzUwMzQ0OTU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1579178510800-5119ac53a276?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Discover the artistic charm of Montmartre, wander through its cobblestone streets, see artists at Place du Tertre, and visit the stunning Sacré-Cœur Basilica for panoramic city views.' 
  },
];

export const MOCK_SUGGESTED_ACTIVITIES_TOKYO: Activity[] = [
  {
    id: 'activity-tokyo-1',
    name: 'Shibuya Crossing Experience',
    location: 'Shibuya Scramble Crossing',
    duration: 1.5,
    imageUrls: [
      'https://images.unsplash.com/photo-1532236234562-0141e5a29a20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Witness the iconic organized chaos of the world\'s busiest pedestrian crossing. Grab a coffee at a nearby cafe for a bird\'s-eye view.'
  },
  {
    id: 'activity-tokyo-2',
    name: 'Senso-ji Temple Visit',
    location: 'Asakusa',
    duration: 2,
    imageUrls: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1588069008739-5404769440cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Explore Tokyo\'s oldest temple, a vibrant cultural and spiritual hub. Don\'t miss Nakamise-dori street leading to the temple, filled with traditional snacks and souvenirs.'
  },
  {
    id: 'activity-tokyo-3',
    name: 'Tokyo Skytree Views',
    location: 'Tokyo Skytree',
    duration: 2.5,
    imageUrls: [
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1578213860249-78201cf323e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Get stunning panoramic views of Tokyo from one of the world\'s tallest towers. On a clear day, you might even see Mount Fuji.'
  },
  {
    id: 'activity-tokyo-4',
    name: 'Tsukiji Outer Market Food Tour',
    location: 'Tsukiji Outer Market',
    duration: 3,
    imageUrls: [
      'https://images.unsplash.com/photo-1573969708938-370990395aa0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1607868398016-f01b151a49f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Indulge in fresh seafood and local delicacies at this bustling market. Perfect for a breakfast or lunch adventure, trying various street foods.'
  }
];

export const MOCK_DESTINATION_ACTIVITIES: Record<string, Activity[]> = {
  "Paris, France": MOCK_SUGGESTED_ACTIVITIES_PARIS,
  "Tokyo, Japan": MOCK_SUGGESTED_ACTIVITIES_TOKYO,
};
