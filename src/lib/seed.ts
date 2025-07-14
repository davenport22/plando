
'use server';

// This script is designed to be run manually from the command line
// to seed the Firestore database with initial data.
import { firestore, isFirebaseInitialized } from './firebase';
import type { Activity } from '@/types';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';

const viennaActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Explore the Naschmarkt", description: "Vienna's largest market offers a vibrant mix of international foods, local delicacies, and lively restaurants.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "vienna market", createdBy: 'system' },
    { name: "Classical Concert at St. Anne's Church", description: "Experience the magic of Mozart and Beethoven in the stunning baroque ambiance of St. Anne's Church.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna church concert", createdBy: 'system' },
    { name: "Visit the Spanish Riding School", description: "Witness the famous Lipizzaner stallions perform their elegant ballet. A truly unique Viennese tradition.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna horses", createdBy: 'system' },
    { name: "Coffee and Cake at a Traditional Viennese Coffee House", description: "Indulge in classic pastries like Sachertorte or Apfelstrudel in a historic setting.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna coffee cake", createdBy: 'system' },
    { name: "Explore the MuseumsQuartier", description: "A vibrant cultural complex featuring modern art, architecture, and trendy cafes.", location: "Vienna, Austria", duration: 3, dataAiHint: "vienna museum art", createdBy: 'system' },
    { name: "Hike in the Vienna Woods (Wienerwald)", description: "Escape the city and enjoy a scenic hike through the beautiful Vienna Woods, offering great views and fresh air.", location: "Vienna, Austria", duration: 4, dataAiHint: "vienna woods forest", createdBy: 'system' },
    { name: "Wine Tasting at a Heurige (Wine Tavern)", description: "Sample local wines and traditional Austrian food at a cozy wine tavern on the outskirts of the city.", location: "Vienna, Austria", duration: 3.5, dataAiHint: "vienna vineyard wine", createdBy: 'system' },
    { name: "Attend the Vienna State Opera", description: "Experience a world-class opera or ballet performance in one of the world's leading opera houses.", location: "Vienna, Austria", duration: 3, dataAiHint: "vienna opera house", createdBy: 'system' },
    { name: "Date at Haus des Meeres", description: "Explore the Aqua Terra Zoo with its impressive shark tank and tropical house, followed by a drink at the stunning rooftop bar.", location: "Vienna, Austria", duration: 3, dataAiHint: "vienna aquarium", createdBy: 'system' },
    { name: "Dinner in the Dark", description: "A unique culinary journey where you dine in complete darkness, heightening your senses of taste and smell.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "dark dining", createdBy: 'system' },
    { name: "Relaxing Day at Therme Wien", description: "Unwind together in one of Europe's most modern city thermal baths, offering various pools, saunas, and relaxation areas.", location: "Vienna, Austria", duration: 5, dataAiHint: "thermal spa", createdBy: 'system' },
    { name: "Goldsmith Workshop for Couples", description: "A creative and romantic experience where you can design and craft your own unique pieces of jewelry together.", location: "Vienna, Austria", duration: 4, dataAiHint: "jewelry making", createdBy: 'system' },
    { name: "Fun at the Prater Amusement Park", description: "Enjoy a nostalgic day out with thrilling rides, games, and a romantic trip on the famous Wiener Riesenrad (Ferris Wheel).", location: "Vienna, Austria", duration: 3.5, dataAiHint: "amusement park", createdBy: 'system' },
    { name: "Stroll through Schönbrunn Gardens", description: "A romantic walk through the magnificent gardens of the former imperial summer residence, with beautiful fountains and the Gloriette.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "vienna palace garden", createdBy: 'system' },
    { name: "View from the Donauturm (Danube Tower)", description: "Enjoy breathtaking 360° panoramic views of Vienna from the observation deck or the rotating restaurant.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna city view", createdBy: 'system' },
    { name: "Visit Belvedere Palace to See 'The Kiss'", description: "Witness Gustav Klimt's masterpiece 'The Kiss' in person at the stunning Belvedere Palace, a perfect romantic art date.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna art palace", createdBy: 'system' },
    { name: "Danube River Evening Cruise", description: "Enjoy a scenic dinner cruise along the Danube, watching the city lights of Vienna glide by.", location: "Vienna, Austria", duration: 3, dataAiHint: "danube river cruise", createdBy: 'system' },
    { name: "Private Fiaker Ride for Two", description: "Take a charming and intimate horse-drawn carriage ride through Vienna's historic city center.", location: "Vienna, Austria", duration: 1, dataAiHint: "vienna carriage ride", createdBy: 'system' },
    { name: "Visit the Imperial Butterfly House", description: "Walk through a tropical oasis in the heart of the city, surrounded by hundreds of free-flying, colorful butterflies.", location: "Vienna, Austria", duration: 1, dataAiHint: "butterfly house", createdBy: 'system' },
    { name: "Austrian Cooking Class for Two", description: "Learn to make classic Austrian dishes like Wiener Schnitzel or Apfelstrudel together in a fun, hands-on class.", location: "Vienna, Austria", duration: 3.5, dataAiHint: "cooking class", createdBy: 'system' }
];

const villachActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Hike on Gerlitzen Alpe", description: "Take the cable car up and hike one of the many trails on Gerlitzen for stunning panoramic views of the surrounding lakes and mountains.", location: "Villach, Austria", duration: 4, dataAiHint: "alps hiking", createdBy: 'system' },
    { name: "Mountain Biking around Lake Faak", description: "Explore the scenic trails around the turquoise waters of Lake Faak, with routes available for all skill levels.", location: "Villach, Austria", duration: 3, dataAiHint: "mountain biking lake", createdBy: 'system' },
    { name: "Stand-up Paddling on Lake Ossiach", description: "Rent a paddleboard and enjoy a relaxing yet sporty day on the beautiful Lake Ossiach, one of Carinthia's largest lakes.", location: "Villach, Austria", duration: 2, dataAiHint: "paddleboarding lake", createdBy: 'system' },
    { name: "Climb at Kletterwald Ossiacher See", description: "Challenge yourselves at this high ropes adventure park with various courses set in the forest right by the lake.", location: "Villach, Austria", duration: 3.5, dataAiHint: "ropes course forest", createdBy: 'system' },
    { name: "Kayaking on the Drau River", description: "Experience Villach from a different perspective with a kayak or canoe tour on the Drau river that flows through the city.", location: "Villach, Austria", duration: 2.5, dataAiHint: "kayaking river", createdBy: 'system' }
];

const allActivities = [
    ...viennaActivities,
    ...villachActivities
];

async function seedDatabase() {
  if (!isFirebaseInitialized) {
    console.error("Firebase not initialized. Cannot seed database. Please check your .env file and ensure Firebase Storage is enabled.");
    return;
  }
  
  const flagRef = firestore.collection('_internal').doc('seed_flag_v11_invited_users');
  const flagDoc = await flagRef.get();

  if (flagDoc.exists) {
    console.log("Database has already been seeded with the latest activities and images. Skipping.");
    return;
  }

  console.log("Starting database seed with AI image generation. This may take a few minutes...");
  const activitiesCollection = firestore.collection('activities');
  
  const querySnapshot = await activitiesCollection.where('createdBy', '==', 'system').get();
  if (!querySnapshot.empty) {
    console.log(`Deleting ${querySnapshot.size} existing system-generated activities...`);
    const deleteBatch = firestore.batch();
    querySnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log("Old activities deleted.");
  }
  
  const writeBatch = firestore.batch();
  let count = 0;

  for (const activityData of allActivities) {
    count++;
    console.log(`[${count}/${allActivities.length}] Generating image for: ${activityData.name}...`);
    try {
        const imageUrl = await generateActivityImage({
            activityName: activityData.name,
            location: activityData.location,
            dataAiHint: activityData.dataAiHint,
        });

        const docRef = activitiesCollection.doc();
        const newActivity: Activity = {
            ...(activityData as Omit<Activity, 'id'>),
            id: docRef.id,
            imageUrls: [imageUrl],
            modules: ['couples', 'friends', 'meet'],
            createdBy: 'system',
            likes: 0,
            dislikes: 0,
        };
        writeBatch.set(docRef, newActivity);
    } catch (error) {
        console.error(`Failed to generate image for "${activityData.name}". Skipping. Error:`, error);
    }
  }

  console.log("Committing all new activities with generated images to the database...");
  await writeBatch.commit();
  
  await flagRef.set({ seededAt: new Date().toISOString(), version: 'v11_invited_users' });
  
  console.log("Database seeded successfully with AI-generated images for all local modules.");
}

seedDatabase().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
