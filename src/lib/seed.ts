
'use server';

// This script is designed to be run manually from the command line
// to seed the Firestore database with initial data.
import { firestore, isFirebaseInitialized } from './firebase';
import type { Activity } from '@/types';
import { generateAndStoreActivityImage } from '@/lib/aiUtils';

const viennaActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Classical Concert at St. Anne's Church", description: "Experience the magic of Mozart and Beethoven in the stunning baroque ambiance of St. Anne's Church.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna church concert", createdBy: 'system' },
    { name: "Coffee and Cake at a Viennese Coffee House", description: "Indulge in classic pastries like Sachertorte or Apfelstrudel in a historic setting.", location: "Vienna, Austria", duration: 1.5, dataAiHint: "vienna coffee cake", createdBy: 'system' },
    { name: "Fun at the Prater Amusement Park", description: "Enjoy a nostalgic day out with thrilling rides, games, and a romantic trip on the famous Wiener Riesenrad (Ferris Wheel).", location: "Vienna, Austria", duration: 3.5, dataAiHint: "amusement park", createdBy: 'system' },
    { name: "Stroll through Schönbrunn Gardens", description: "A romantic walk through the magnificent gardens of the former imperial summer residence, with beautiful fountains and the Gloriette.", location: "Vienna, Austria", duration: 2.5, dataAiHint: "vienna palace garden", createdBy: 'system' },
    { name: "Visit Belvedere Palace to See 'The Kiss'", description: "Witness Gustav Klimt's masterpiece 'The Kiss' in person at the stunning Belvedere Palace, a perfect romantic art date.", location: "Vienna, Austria", duration: 2, dataAiHint: "vienna art palace", createdBy: 'system' },
];

const villachActivities: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes' | 'modules'>[] = [
    { name: "Hike on Gerlitzen Alpe", description: "Take the cable car up and hike one of the many trails on Gerlitzen for stunning panoramic views of the surrounding lakes and mountains.", location: "Villach, Austria", duration: 4, dataAiHint: "alps hiking", createdBy: 'system' },
    { name: "Mountain Biking around Lake Faak", description: "Explore the scenic trails around the turquoise waters of Lake Faak, with routes available for all skill levels.", location: "Villach, Austria", duration: 3, dataAiHint: "mountain biking lake", createdBy: 'system' },
    { name: "Stand-up Paddling on Lake Ossiach", description: "Rent a paddleboard and enjoy a relaxing yet sporty day on the beautiful Lake Ossiach, one of Carinthia's largest lakes.", location: "Villach, Austria", duration: 2, dataAiHint: "paddleboarding lake", createdBy: 'system' },
    { name: "Climb at Kletterwald Ossiacher See", description: "Challenge yourselves at this high ropes adventure park with various courses set in the forest right by the lake.", location: "Villach, Austria", duration: 3.5, dataAiHint: "ropes course forest", createdBy: 'system' },
    { name: "Kayaking on the Drau River", description: "Experience Villach from a different perspective with a kayak or canoe tour on the Drau river that flows through the city.", location: "Villach, Austria", duration: 2.5, dataAiHint: "kayaking river", createdBy: 'system' }
];

const allActivities = [...viennaActivities, ...villachActivities];
const SEED_FLAG_VERSION = 'v1_final_working_seed';

async function seedDatabase() {
  if (!isFirebaseInitialized) {
    console.error("Firebase not initialized. Cannot seed database. Please check your .env file and ensure Firebase Storage is enabled.");
    return;
  }

  const flagRef = firestore.collection('_internal').doc(SEED_FLAG_VERSION);
  const flagDoc = await flagRef.get();

  if (flagDoc.exists) {
      console.log(`Database has already been seeded with version: ${SEED_FLAG_VERSION}. Halting.`);
      return;
  }
  
  console.log(`Starting database seed (version: ${SEED_FLAG_VERSION}). This may take a minute...`);
  
  // 1. Delete all existing system-generated activities to ensure a clean slate.
  console.log("Deleting all old system-generated activities...");
  const activitiesCollection = firestore.collection('activities');
  const querySnapshot = await activitiesCollection.where('createdBy', '==', 'system').get();
  if (!querySnapshot.empty) {
    const deleteBatch = firestore.batch();
    querySnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log(`Deleted ${querySnapshot.size} old system activities.`);
  } else {
    console.log("No old system activities found to delete.");
  }
  
  // 2. Create new activities with AI-generated images.
  const writeBatch = firestore.batch();
  let successCount = 0;

  for (const activityData of allActivities) {
    console.log(`[${successCount + 1}/${allActivities.length}] Processing: ${activityData.name}...`);
    try {
        const imageUrl = await generateAndStoreActivityImage(
            activityData.name,
            activityData.location,
            activityData.dataAiHint,
        );

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
        successCount++;
        console.log(` -> Image generated and activity queued for "${activityData.name}".`);
    } catch (error) {
        console.error(` -> Failed to process "${activityData.name}". Skipping. Error:`, error);
    }
  }

  // 3. Commit all the new activities to the database.
  if (successCount > 0) {
      console.log(`Committing ${successCount} new activities to the database...`);
      await writeBatch.commit();
      console.log(`Successfully added ${successCount} new activities.`);
  } else {
      console.log("No new activities were successfully processed to commit.");
  }
  
  // 4. Set the flag ONLY after everything is successful.
  await flagRef.set({ seededAt: new Date().toISOString(), version: SEED_FLAG_VERSION });
  
  console.log("Database seeding complete.");
}

seedDatabase().catch(error => {
  console.error('Seeding script failed with a critical error:', error);
  process.exit(1);
});
