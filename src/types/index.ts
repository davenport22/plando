
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserProfile extends User {
  bio: string;
  location: string; // The user's home city, e.g., "Vienna, Austria". Used for local activity suggestions.
  memberSince: string;
  interests: string[];
  avatarUrl?: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string; // The destination city for the trip, e.g., "Paris, France"
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
  location: string; // The location of the activity, typically within the trip's destination city.
  duration: number; // in hours
  isLiked?: boolean;
  imageUrls: string[];
  category?: 'Must Do' | 'Recommended' | 'Optional';
  startTime?: string; // HH:mm
  likes?: number;
  dislikes?: number;
  // Fields that can be enhanced by AI
  suggestedDurationHours?: number;
  bestTimeToVisit?: string;
  estimatedPriceRange?: string;
  address?: string;
  dataAiHint?: string; 
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

export const MOCK_USER_PARTNER_1: UserProfile = {
  id: 'partner1',
  name: 'Jamie Doe',
  email: 'jamie@example.com',
  bio: 'Loves hiking and exploring new cafes.',
  location: 'Vienna, Austria',
  memberSince: 'June 2023',
  interests: ['Hiking', 'Coffee', 'Photography', 'Art'],
  avatarUrl: 'https://avatar.vercel.sh/jamie.png',
};

export const MOCK_USER_PARTNER_2: UserProfile = {
  id: 'partner2',
  name: 'Casey Smith',
  email: 'casey@example.com',
  bio: 'Passionate about food, travel, and music festivals.',
  location: 'Berlin, Germany',
  memberSince: 'August 2023',
  interests: ['Foodie', 'Travel', 'Music', 'Festivals'],
  avatarUrl: 'https://avatar.vercel.sh/casey.png',
};

export const MOCK_USER_PARTNER_JULIA: UserProfile = {
  id: 'partnerJulia',
  name: 'Julia Musterfrau',
  email: 'julia.musterfrau@gmail.com',
  bio: 'Enjoys quiet evenings, good books, and long walks.',
  location: 'Munich, Germany',
  memberSince: 'January 2024',
  interests: ['Reading', 'Nature', 'Photography', 'Art'],
  avatarUrl: 'https://avatar.vercel.sh/julia.png', // Using vercel avatar as a stock photo
};

export const MOCK_POTENTIAL_PARTNERS: UserProfile[] = [MOCK_USER_PARTNER_1, MOCK_USER_PARTNER_2, MOCK_USER_PARTNER_JULIA];

export const ALL_MOCK_USERS: UserProfile[] = [MOCK_USER_PROFILE, ...MOCK_POTENTIAL_PARTNERS];


export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip1',
    name: 'Paris Adventure',
    destination: 'Paris, France',
    startDate: '2024-09-10',
    endDate: '2024-09-17',
    ownerId: 'user1',
    participantIds: ['user1', 'user2'],
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
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
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1510125960040-a488747b040b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Ascend the iconic Eiffel Tower for breathtaking panoramic views of Paris. Consider booking tickets in advance to skip long queues, especially during peak season. The evening light show is also a must-see.',
    dataAiHint: "eiffel tower"
  },
  {
    id: 'activity-paris-2',
    name: 'Louvre Museum Tour',
    location: 'Louvre Museum, Rue de Rivoli',
    duration: 4,
    imageUrls: [
      'https://images.unsplash.com/photo-1587648415693-4a5362b2ce41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsb3V2cmV8ZW58MHx8fHwxNzUwMzQ0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1590101152024-1a0792027179?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Explore world-renowned art collections, including the Mona Lisa and Venus de Milo. The museum is vast; plan your visit to focus on specific wings or masterpieces to make the most of your time.',
    dataAiHint: "louvre museum"
  },
  {
    id: 'activity-paris-3',
    name: 'Seine River Cruise',
    location: 'Seine River Banks',
    duration: 1.5,
    imageUrls: [
      'https://images.unsplash.com/photo-1504896287989-ff1fbde00199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxzZWluZSUyMHJpdmVyfGVufDB8fHx8MTc1MDM0NDkwOXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1558380733-e6a30704f782?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Enjoy a relaxing boat tour along the Seine, passing famous landmarks like Notre Dame Cathedral, Musée d\'Orsay, and the Louvre. Evening cruises offer a magical view of the illuminated city.',
    dataAiHint: "seine river"
  },
  {
    id: 'activity-paris-4',
    name: 'Montmartre & Sacré-Cœur',
    location: 'Montmartre District',
    duration: 3,
    imageUrls: [
      'https://images.unsplash.com/photo-1702375308488-de52189a0ff3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxtb250bWFydHJlJTIwc2FjcmV8ZW58MHx8fHwxNzUwMzQ0OTU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1579178510800-5119ac53a276?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Discover the artistic charm of Montmartre, wander through its cobblestone streets, see artists at Place du Tertre, and visit the stunning Sacré-Cœur Basilica for panoramic city views.',
    dataAiHint: "montmartre paris"
  },
];

export const MOCK_SUGGESTED_ACTIVITIES_TOKYO: Activity[] = [
  {
    id: 'activity-tokyo-1',
    name: 'Shibuya Crossing Experience',
    location: 'Shibuya Scramble Crossing',
    duration: 1.5,
    imageUrls: ['https://images.unsplash.com/photo-1617150929921-636459f9d103?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Witness the iconic organized chaos of the world\'s busiest pedestrian crossing. Grab a coffee at a nearby cafe for a bird\'s-eye view.',
    dataAiHint: "shibuya crossing"
  },
  {
    id: 'activity-tokyo-2',
    name: 'Senso-ji Temple Visit',
    location: 'Asakusa',
    duration: 2,
    imageUrls: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1588069008739-5404769440cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Explore Tokyo\'s oldest temple, a vibrant cultural and spiritual hub. Don\'t miss Nakamise-dori street leading to the temple, filled with traditional snacks and souvenirs.',
    dataAiHint: "sensoji temple"
  },
  {
    id: 'activity-tokyo-3',
    name: 'Tokyo Skytree Views',
    location: 'Tokyo Skytree',
    duration: 2.5,
    imageUrls: [
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1578213860249-78201cf323e1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Get stunning panoramic views of Tokyo from one of the world\'s tallest towers. On a clear day, you might even see Mount Fuji.',
    dataAiHint: "tokyo skytree"
  },
  {
    id: 'activity-tokyo-4',
    name: 'Tsukiji Outer Market Food Tour',
    location: 'Tsukiji Outer Market',
    duration: 3,
    imageUrls: [
      'https://images.unsplash.com/photo-1573969708938-370990395aa0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1607868398016-f01b151a49f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'
    ],
    description: 'Indulge in fresh seafood and local delicacies at this bustling market. Perfect for a breakfast or lunch adventure, trying various street foods.',
    dataAiHint: "tsukiji market"
  }
];

export const MOCK_DESTINATION_ACTIVITIES: Record<string, Activity[]> = {
  "Paris, France": MOCK_SUGGESTED_ACTIVITIES_PARIS,
  "Tokyo, Japan": MOCK_SUGGESTED_ACTIVITIES_TOKYO,
};

// --- Plando Meet/Friends Specific Mock Data ---
const DEFAULT_MOCK_LOCAL_ACTIVITIES: Activity[] = [
  {
    id: 'local-activity-default-1',
    name: 'City Park Stroll & Picnic',
    location: 'Local City Park',
    duration: 2,
    imageUrls: ['https://images.unsplash.com/photo-1542879997-f09255010477?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Enjoy a refreshing walk or bike ride through the main city park, maybe pack a picnic!',
    dataAiHint: "city park picnic",
    bestTimeToVisit: "Afternoons on sunny days, Weekends",
    estimatedPriceRange: "Free (picnic costs vary)"
  },
  {
    id: 'local-activity-default-2',
    name: 'Independent Bookstore Browse',
    location: 'Downtown Area',
    duration: 1,
    imageUrls: ['https://images.unsplash.com/photo-1530096161592-28369c58991a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Discover hidden gems and bestsellers at a local independent bookstore.',
    dataAiHint: "bookstore interior",
    bestTimeToVisit: "Anytime, quieter on weekday mornings",
    estimatedPriceRange: "Free to browse"
  },
  {
    id: 'local-activity-default-3',
    name: 'Community Art Gallery Visit',
    location: 'Arts District',
    duration: 1.5,
    imageUrls: ['https://images.unsplash.com/photo-1536924430914-92f9a6909076?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Explore works by local artists at the community gallery. Check for new exhibits.',
    dataAiHint: "art gallery",
    bestTimeToVisit: "Weekend afternoons or opening evenings",
    estimatedPriceRange: "Often free, donations welcome"
  },
];

const MOCK_VIENNA_ACTIVITIES: Activity[] = [
  {
    id: 'local-vienna-1',
    name: 'Schönbrunn Palace Gardens Walk',
    location: 'Schönbrunn Palace, Vienna',
    duration: 2.5,
    imageUrls: ['https://images.unsplash.com/photo-1587616596304-987fde18990d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Wander through the magnificent gardens of the former imperial summer residence, a UNESCO World Heritage site.',
    suggestedDurationHours: 2.5,
    bestTimeToVisit: "Spring or Summer mornings/afternoons",
    estimatedPriceRange: "Gardens mostly free, palace entry fee applies",
    address: "Schönbrunner Schloßstraße 47, 1130 Wien",
    dataAiHint: "schonbrunn palace"
  },
  {
    id: 'local-vienna-2',
    name: 'St. Stephen\'s Cathedral & Tower Climb',
    location: 'Stephansplatz, Vienna',
    duration: 1.5,
    imageUrls: ['https://images.unsplash.com/photo-1608958449814-e896490174a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Visit the iconic Gothic cathedral and climb the South Tower for breathtaking views of the city.',
    suggestedDurationHours: 1.5,
    bestTimeToVisit: "Mornings to avoid crowds, Any season",
    estimatedPriceRange: "Free entry to main area, tower/catacombs approx. €6-€10",
    address: "Stephansplatz 3, 1010 Wien",
    dataAiHint: "st stephens cathedral"
  },
  {
    id: 'local-vienna-3',
    name: 'Naschmarkt Food Exploration',
    location: 'Naschmarkt, Vienna',
    duration: 2,
    imageUrls: ['https://images.unsplash.com/photo-1518300210072-6497ca050313?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Explore Vienna\'s most popular market, offering a variety of international foods, local produce, and vibrant stalls.',
    suggestedDurationHours: 2,
    bestTimeToVisit: "Late morning/lunchtime, Saturday for flea market",
    estimatedPriceRange: "Varies (free to browse, food items €5+)",
    address: "Naschmarkt, 1060 Wien",
    dataAiHint: "naschmarkt vienna"
  },
  {
    id: 'local-vienna-4',
    name: 'Coffee at a Traditional Viennese Coffee House',
    location: 'Inner Stadt, Vienna',
    duration: 1,
    imageUrls: ['https://images.unsplash.com/photo-1559925198-8f03a9b70f8a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Experience the unique culture of a traditional Viennese coffee house (Kaffeehaus). Try a Melange coffee and a slice of Sachertorte.',
    suggestedDurationHours: 1,
    bestTimeToVisit: "Anytime, often busier in afternoons",
    estimatedPriceRange: "€5-€15 per person for coffee & cake",
    address: "Various locations, e.g., Cafe Central, Cafe Sacher",
    dataAiHint: "viennese coffee"
  },
  {
    id: 'local-vienna-5',
    name: 'Explore the Hofburg Palace Complex',
    location: 'Hofburg, Vienna',
    duration: 3,
    imageUrls: ['https://images.unsplash.com/photo-1629367462687-3e4b787b6192?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Discover the vast former imperial palace of the Habsburg dynasty. The complex includes the Imperial Apartments, the Sisi Museum, and the Imperial Treasury.',
    suggestedDurationHours: 3,
    bestTimeToVisit: "Weekday mornings to avoid large crowds",
    estimatedPriceRange: "€15-€25 per person depending on ticket",
    address: "Michaelerkuppel, 1010 Wien",
    dataAiHint: "hofburg palace vienna"
  },
  {
    id: 'local-vienna-6',
    name: 'Attend a Performance at the Vienna State Opera',
    location: 'Vienna State Opera',
    duration: 3,
    imageUrls: ['https://images.unsplash.com/photo-1571166319809-54d588942b00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Experience a world-class opera or ballet performance in one of the most famous opera houses in the world. Book tickets well in advance or try for affordable last-minute standing room tickets.',
    suggestedDurationHours: 3,
    bestTimeToVisit: "Evenings (check schedule)",
    estimatedPriceRange: "Varies widely (€10 for standing room to €250+)",
    address: "Opernring 2, 1010 Wien",
    dataAiHint: "vienna opera house"
  },
  {
    id: 'local-vienna-7',
    name: 'See the Lipizzaner Stallions',
    location: 'Spanish Riding School, Hofburg',
    duration: 1.5,
    imageUrls: ['https://images.unsplash.com/photo-1599427303039-4f5186b8c495?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Watch the famous Lipizzaner horses perform their classical dressage "ballet". Morning exercises are a more affordable way to see them in training.',
    suggestedDurationHours: 1.5,
    bestTimeToVisit: "Morning exercises or performance times",
    estimatedPriceRange: "€15 (morning exercise) to €100+ (performance)",
    address: "Michaelerplatz 1, 1010 Wien",
    dataAiHint: "lipizzaner horse vienna"
  },
  {
    id: 'local-vienna-8',
    name: 'Immerse Yourself in Art at the Museumsquartier',
    location: 'Museumsquartier, Vienna',
    duration: 4,
    imageUrls: ['https://images.unsplash.com/photo-1587569192425-a86477e81156?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Explore one of the world\'s largest art and culture complexes, home to the Leopold Museum (Schiele), MUMOK (modern art), and vibrant courtyards with cafes.',
    suggestedDurationHours: 4,
    bestTimeToVisit: "Anytime, lively in the afternoon/evening",
    estimatedPriceRange: "Museum entry €14-€18 per museum, courtyards free",
    address: "Museumsplatz 1, 1070 Wien",
    dataAiHint: "museumsquartier vienna"
  },
  {
    id: 'local-vienna-9',
    name: 'Visit the Belvedere Palace & Gardens',
    location: 'Belvedere Palace, Vienna',
    duration: 2.5,
    imageUrls: ['https://images.unsplash.com/photo-1580054604995-7478f2f58cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Discover two magnificent Baroque palaces, beautiful gardens, and the world\'s largest collection of Gustav Klimt paintings, including "The Kiss".',
    suggestedDurationHours: 2.5,
    bestTimeToVisit: "Mornings or late afternoons",
    estimatedPriceRange: "€16-€24 per person (Upper/Lower Belvedere)",
    address: "Prinz Eugen-Straße 27, 1030 Wien",
    dataAiHint: "belvedere palace vienna"
  },
  {
    id: 'local-vienna-10',
    name: 'Ride the Giant Ferris Wheel at the Prater',
    location: 'Prater Amusement Park, Vienna',
    duration: 3,
    imageUrls: ['https://images.unsplash.com/photo-1597843799635-3c138a0f4438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Enjoy the nostalgic atmosphere of one of the world\'s oldest amusement parks and take a ride on the iconic Wiener Riesenrad for stunning city views.',
    suggestedDurationHours: 3,
    bestTimeToVisit: "Afternoons and evenings, especially in summer",
    estimatedPriceRange: "Free entry, pay per ride (Ferris Wheel ~€13.50)",
    address: "Riesenradplatz, 1020 Wien",
    dataAiHint: "prater park vienna"
  },
  {
    id: 'local-vienna-11',
    name: 'Photograph the Hundertwasser House',
    location: 'Landstraße district, Vienna',
    duration: 0.5,
    imageUrls: ['https://images.unsplash.com/photo-1579523620984-99ef177533a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Visit the unique and colorful apartment building designed by artist Friedensreich Hundertwasser, a landmark of expressionist architecture.',
    suggestedDurationHours: 0.5,
    bestTimeToVisit: "Daytime for best photos",
    estimatedPriceRange: "Free (view from outside only)",
    address: "Kegelgasse 36-38, 1030 Wien",
    dataAiHint: "hundertwasser house vienna"
  },
  {
    id: 'local-vienna-12',
    name: 'Discover Masterpieces at the Albertina Museum',
    location: 'Albertina Museum, Vienna',
    duration: 2,
    imageUrls: ['https://images.unsplash.com/photo-1629367462608-2c2f7b2e8f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Explore impressive collections ranging from Monet to Picasso and view world-class graphic art in a former Habsburg palace.',
    suggestedDurationHours: 2,
    bestTimeToVisit: "Anytime, less crowded on weekday mornings",
    estimatedPriceRange: "Around €18 per person",
    address: "Albertinaplatz 1, 1010 Wien",
    dataAiHint: "albertina museum vienna"
  }
];


export const MOCK_ACTIVITIES_BY_CITY: Record<string, Activity[]> = {
  "Vienna, Austria": MOCK_VIENNA_ACTIVITIES,
  "Default": DEFAULT_MOCK_LOCAL_ACTIVITIES,
};


// --- Plando Couples Specific Mock Data ---
const MOCK_COUPLES_DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'couples-default-1',
    name: 'Romantic Sunset Picnic',
    location: 'Scenic Viewpoint or Park',
    duration: 2.5,
    imageUrls: ['https://images.unsplash.com/photo-1515002246390-7bf14be4598a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Pack a basket with your favorite treats and find a beautiful spot to watch the sunset together.',
    dataAiHint: "couple picnic sunset",
    bestTimeToVisit: "Evenings, just before sunset",
    estimatedPriceRange: "Cost of picnic items"
  },
  {
    id: 'couples-default-2',
    name: 'Cozy Movie Night In',
    location: 'At Home',
    duration: 3,
    imageUrls: ['https://images.unsplash.com/photo-1595777457584-9d776c177dd8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Choose a movie, grab some popcorn, and cuddle up for a relaxing evening.',
    dataAiHint: "couple movie night",
    bestTimeToVisit: "Evenings",
    estimatedPriceRange: "Free (or cost of movie rental)"
  },
  {
    id: 'couples-default-3',
    name: 'Stargazing Adventure',
    location: 'Away from City Lights',
    duration: 2,
    imageUrls: ['https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Find a dark spot away from city lights, lay out a blanket, and gaze at the stars together.',
    dataAiHint: "couple stargazing",
    bestTimeToVisit: "Clear nights",
    estimatedPriceRange: "Free"
  },
];

const MOCK_COUPLES_VIENNA_ACTIVITIES: Activity[] = [
  {
    id: 'couples-vienna-1',
    name: 'Romantic Danube River Evening Cruise',
    location: 'Danube River, Vienna',
    duration: 3,
    imageUrls: ['https://images.unsplash.com/photo-1620596541499-a6713919f0e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Enjoy a scenic cruise along the Danube with dinner and music as the city lights twinkle.',
    dataAiHint: "danube cruise vienna",
    bestTimeToVisit: "Evenings, especially during sunset hours",
    estimatedPriceRange: "€50-€100 per person (with dinner)"
  },
  {
    id: 'couples-vienna-2',
    name: 'Belvedere Palace & Klimt\'s "The Kiss"',
    location: 'Belvedere Palace, Vienna',
    duration: 2.5,
    imageUrls: ['https://images.unsplash.com/photo-1580054604995-7478f2f58cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Explore the stunning baroque palace and see Gustav Klimt\'s masterpiece "The Kiss" together.',
    dataAiHint: "belvedere palace",
    bestTimeToVisit: "Mornings or late afternoons to avoid crowds",
    estimatedPriceRange: "€20-€25 per person (entry)"
  },
  {
    id: 'couples-vienna-3',
    name: 'Wine Tasting in Viennese Vineyards (Heuriger)',
    location: 'Outskirts of Vienna (e.g., Kahlenberg, Grinzing)',
    duration: 3,
    imageUrls: ['https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Visit a traditional Viennese wine tavern (Heuriger) in the vineyards for local wine and food.',
    dataAiHint: "vienna vineyards wine",
    bestTimeToVisit: "Late afternoons or evenings, especially in summer/autumn",
    estimatedPriceRange: "€15-€30 per person"
  },
  {
    id: 'couples-vienna-4',
    name: 'Attend a Classical Concert',
    location: 'Various churches (e.g., St. Anne\'s, Karlskirche)',
    duration: 1.5,
    imageUrls: ['https://images.unsplash.com/photo-1608958449764-16a13b41d471?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Experience the music of Mozart and Strauss in an intimate, historical setting. A truly romantic Viennese evening.',
    dataAiHint: "vienna classical concert",
    bestTimeToVisit: "Evenings",
    estimatedPriceRange: "€30-€50 per person"
  },
  {
    id: 'couples-vienna-5',
    name: 'Stroll Through the Volksgarten Rose Garden',
    location: 'Volksgarten, Vienna',
    duration: 1,
    imageUrls: ['https://images.unsplash.com/photo-1587327956460-a2943411b542?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Enjoy a romantic walk among thousands of beautiful roses. A perfect spot for photos and quiet moments.',
    dataAiHint: "vienna rose garden",
    bestTimeToVisit: "Late Spring/Summer when roses are in bloom",
    estimatedPriceRange: "Free"
  },
  {
    id: 'couples-vienna-6',
    name: 'Take a Fiaker Ride Through the City Center',
    location: 'Inner Stadt, departs from Stephansplatz or Hofburg',
    duration: 0.75,
    imageUrls: ['https://images.unsplash.com/photo-1599881858349-8bd3c2180e6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80'],
    description: 'Experience old-world charm with a traditional horse-drawn carriage ride through Vienna\'s historic streets.',
    dataAiHint: "fiaker vienna carriage",
    bestTimeToVisit: "Anytime, especially charming in the evening",
    estimatedPriceRange: "€55-€95 per carriage"
  }
];

// Specific list of activity IDs that Julia Musterfrau is mocked to have "liked"
export const JULIA_MOCKED_LIKES: string[] = ['couples-vienna-1', 'couples-vienna-2'];


export const MOCK_COUPLES_ACTIVITIES_BY_CITY: Record<string, Activity[]> = {
  "Vienna, Austria": MOCK_COUPLES_VIENNA_ACTIVITIES,
  "Default": MOCK_COUPLES_DEFAULT_ACTIVITIES,
};

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    dataAiHint?: string;
  }
}
