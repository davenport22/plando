
// This script is designed to be run manually from the command line
// to seed the Firestore database with initial data.
import { firestore, isFirebaseInitialized } from './firebase';
import type { Activity } from '@/types';

const viennaActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Explore the Naschmarkt", imageUrls: ["https://images.unsplash.com/photo-1590393275647-6744783353b3?q=80&w=800&auto=format&fit=crop"], description: "Vienna's largest market offers a vibrant mix of international foods, local delicacies, and lively restaurants.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "vienna market", createdBy: 'system' },
    { name: "Classical Concert at St. Anne's Church", imageUrls: ["https://images.unsplash.com/photo-1518542568836-39d43f389953?q=80&w=800&auto=format&fit=crop"], description: "Experience the magic of Mozart and Beethoven in the stunning baroque ambiance of St. Anne's Church.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna church concert", createdBy: 'system' },
    { name: "Visit the Spanish Riding School", imageUrls: ["https://images.unsplash.com/photo-1563273618-20739c9a09f6?q=80&w=800&auto=format&fit=crop"], description: "Witness the famous Lipizzaner stallions perform their elegant ballet. A truly unique Viennese tradition.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna horses", createdBy: 'system' },
    { name: "Coffee and Cake at a Traditional Viennese Coffee House", imageUrls: ["https://images.unsplash.com/photo-1559925239-a9b4ad1a9578?q=80&w=800&auto=format&fit=crop"], description: "Indulge in classic pastries like Sachertorte or Apfelstrudel in a historic setting.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna coffee cake", createdBy: 'system' },
    { name: "Explore the MuseumsQuartier", imageUrls: ["https://images.unsplash.com/photo-1616836100597-f55973e51a6d?q=80&w=800&auto=format&fit=crop"], description: "A vibrant cultural complex featuring modern art, architecture, and trendy cafes.", location: "Vienna, Austria", duration: 3, dataAiHint: "vienna museum art", createdBy: 'system' },
    { name: "Hike in the Vienna Woods (Wienerwald)", imageUrls: ["https://images.unsplash.com/photo-1505364812370-137881b2395d?q=80&w=800&auto=format&fit=crop"], description: "Escape the city and enjoy a scenic hike through the beautiful Vienna Woods, offering great views and fresh air.", location: "Vienna, Austria", duration: 4, dataAiHint: "vienna woods forest", createdBy: 'system' },
    { name: "Wine Tasting at a Heurige (Wine Tavern)", imageUrls: ["https://images.unsplash.com/photo-1580974917429-299321798c8c?q=80&w=800&auto=format&fit=crop"], description: "Sample local wines and traditional Austrian food at a cozy wine tavern on the outskirts of the city.", location: "Vienna, Austria", duration: 3.5, dataAiHint: "vienna vineyard wine", createdBy: 'system' },
    { name: "Attend the Vienna State Opera", imageUrls: ["https://images.unsplash.com/photo-1582221639978-3c467904c274?q=80&w=800&auto=format&fit=crop"], description: "Experience a world-class opera or ballet performance in one of the world's leading opera houses.", location: "Vienna, Austria", duration: 3, dataAiHint: "vienna opera house", createdBy: 'system' },
    { name: "Date at Haus des Meeres", imageUrls: ["https://images.unsplash.com/photo-1544195393-25a815b37e8c?q=80&w=800&auto=format&fit=crop"], description: "Explore the Aqua Terra Zoo with its impressive shark tank and tropical house, followed by a drink at the stunning rooftop bar.", location: "Vienna, Austria", duration: 3, dataAiHint: "vienna aquarium", createdBy: 'system' },
    { name: "Dinner in the Dark", imageUrls: ["https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800&auto=format&fit=crop"], description: "A unique culinary journey where you dine in complete darkness, heightening your senses of taste and smell.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "dark dining", createdBy: 'system' },
    { name: "Relaxing Day at Therme Wien", imageUrls: ["https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop"], description: "Unwind together in one of Europe's most modern city thermal baths, offering various pools, saunas, and relaxation areas.", location: "Vienna, Austria", duration: 5, dataAiHint: "thermal spa", createdBy: 'system' },
    { name: "Goldsmith Workshop for Couples", imageUrls: ["https://images.unsplash.com/photo-1611094603498-4cf6055d734e?q=80&w=800&auto=format&fit=crop"], description: "A creative and romantic experience where you can design and craft your own unique pieces of jewelry together.", location: "Vienna, Austria", duration: 4, dataAiHint: "jewelry making", createdBy: 'system' },
    { name: "Fun at the Prater Amusement Park", imageUrls: ["https://images.unsplash.com/photo-1597463567421-3e33f3607c64?q=80&w=800&auto=format&fit=crop"], description: "Enjoy a nostalgic day out with thrilling rides, games, and a romantic trip on the famous Wiener Riesenrad (Ferris Wheel).", location: "Vienna, Austria", duration: 3.5, dataAiHint: "amusement park", createdBy: 'system' },
    { name: "Stroll through Schönbrunn Gardens", imageUrls: ["https://images.unsplash.com/photo-1617006622153-f7553f8a652a?q=80&w=800&auto=format&fit=crop"], description: "A romantic walk through the magnificent gardens of the former imperial summer residence, with beautiful fountains and the Gloriette.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "vienna palace garden", createdBy: 'system' },
    { name: "View from the Donauturm (Danube Tower)", imageUrls: ["https://images.unsplash.com/photo-1629828114062-1f4560335a50?q=80&w=800&auto=format&fit=crop"], description: "Enjoy breathtaking 360° panoramic views of Vienna from the observation deck or the rotating restaurant.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna city view", createdBy: 'system' },
    { name: "Visit Belvedere Palace to See 'The Kiss'", imageUrls: ["https://images.unsplash.com/photo-1563214080-132476536067?q=80&w=800&auto=format&fit=crop"], description: "Witness Gustav Klimt's masterpiece 'The Kiss' in person at the stunning Belvedere Palace, a perfect romantic art date.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna art palace", createdBy: 'system' },
    { name: "Danube River Evening Cruise", imageUrls: ["https://images.unsplash.com/photo-1598516880324-5415c432a58a?q=80&w=800&auto=format&fit=crop"], description: "Enjoy a scenic dinner cruise along the Danube, watching the city lights of Vienna glide by.", location: "Vienna, Austria", duration: 3, dataAiHint: "danube river cruise", createdBy: 'system' },
    { name: "Private Fiaker Ride for Two", imageUrls: ["https://images.unsplash.com/photo-1579582155336-6477b73c4f74?q=80&w=800&auto=format&fit=crop"], description: "Take a charming and intimate horse-drawn carriage ride through Vienna's historic city center.", location: "Vienna, Austria", duration: 1, dataAiHint: "vienna carriage ride", createdBy: 'system' },
    { name: "Visit the Imperial Butterfly House", imageUrls: ["https://images.unsplash.com/photo-1522249673934-2985f4036e52?q=80&w=800&auto=format&fit=crop"], description: "Walk through a tropical oasis in the heart of the city, surrounded by hundreds of free-flying, colorful butterflies.", location: "Vienna, Austria", duration: 1, dataAiHint: "butterfly house", createdBy: 'system' },
    { name: "Austrian Cooking Class for Two", imageUrls: ["https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=800&auto=format&fit=crop"], description: "Learn to make classic Austrian dishes like Wiener Schnitzel or Apfelstrudel together in a fun, hands-on class.", location: "Vienna, Austria", duration: 3.5, dataAiHint: "cooking class", createdBy: 'system' }
];

const villachActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Hike on Gerlitzen Alpe", imageUrls: ["https://images.unsplash.com/photo-1616253442348-e47144e580e5?q=80&w=800&auto=format&fit=crop"], description: "Take the cable car up and hike one of the many trails on Gerlitzen for stunning panoramic views of the surrounding lakes and mountains.", location: "Villach, Austria", duration: 4, dataAiHint: "alps hiking", createdBy: 'system' },
    { name: "Mountain Biking around Lake Faak", imageUrls: ["https://images.unsplash.com/photo-1572338279893-5e93f1e185b3?q=80&w=800&auto=format&fit=crop"], description: "Explore the scenic trails around the turquoise waters of Lake Faak, with routes available for all skill levels.", location: "Villach, Austria", duration: 3, dataAiHint: "mountain biking lake", createdBy: 'system' },
    { name: "Stand-up Paddling on Lake Ossiach", imageUrls: ["https://images.unsplash.com/photo-1589889422634-b2a1bd7185c7?q=80&w=800&auto=format&fit=crop"], description: "Rent a paddleboard and enjoy a relaxing yet sporty day on the beautiful Lake Ossiach, one of Carinthia's largest lakes.", location: "Villach, Austria", duration: 2, dataAiHint: "paddleboarding lake", createdBy: 'system' },
    { name: "Climb at Kletterwald Ossiacher See", imageUrls: ["https://images.unsplash.com/photo-1562913165-718e27c19356?q=80&w=800&auto=format&fit=crop"], description: "Challenge yourselves at this high ropes adventure park with various courses set in the forest right by the lake.", location: "Villach, Austria", duration: 3.5, dataAiHint: "ropes course forest", createdBy: 'system' },
    { name: "Kayaking on the Drau River", imageUrls: ["https://images.unsplash.com/photo-1620932900985-64157d53a25e?q=80&w=800&auto=format&fit=crop"], description: "Experience Villach from a different perspective with a kayak or canoe tour on the Drau river that flows through the city.", location: "Villach, Austria", duration: 2.5, dataAiHint: "kayaking river", createdBy: 'system' }
];

const allActivities = [
    ...viennaActivities,
    ...villachActivities
];

async function seedDatabase() {
  if (!isFirebaseInitialized) {
    console.error("Firebase not initialized. Cannot seed database. Please check your .env file.");
    return;
  }
  
  const flagRef = firestore.collection('_internal').doc('seed_flag_v8');
  const flagDoc = await flagRef.get();

  if (flagDoc.exists) {
    console.log("Database has already been seeded with the latest activities. Skipping.");
    return;
  }

  console.log("Starting database seed...");
  const activitiesCollection = firestore.collection('activities');
  const batch = firestore.batch();
  
  const querySnapshot = await activitiesCollection.where('createdBy', '==', 'system').get();
  if (!querySnapshot.empty) {
    console.log(`Deleting ${querySnapshot.size} existing system-generated activities...`);
    querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
  }

  console.log(`Adding ${allActivities.length} new activities...`);
  for (const activityData of allActivities) {
    const docRef = activitiesCollection.doc();
    const newActivity: Activity = {
        ...(activityData as Omit<Activity, 'id'>),
        id: docRef.id,
        modules: ['couples', 'friends', 'meet'],
        createdBy: 'system',
        likes: 0,
        dislikes: 0,
    };
    batch.set(docRef, newActivity);
  }

  batch.set(flagRef, { seededAt: new Date().toISOString(), version: 8 });
  
  await batch.commit();
  console.log("Database seeded successfully with all activities.");
}

seedDatabase().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
