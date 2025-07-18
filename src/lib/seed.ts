
'use server';

import { firestore, isFirebaseInitialized } from './firebase';
import type { Activity } from '@/types';
import { generateAndStoreActivityImage } from './aiUtils';
import { generateActivityDescription } from '@/ai/flows/generate-activity-description-flow';

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
    { name: "Kayaking on the Drau River", description: "Experience Villach from a different perspective with a kayak or canoe tour on the Drau river that flows through the city.", location: "Villach, Austria", duration: 2.5, dataAiHint: "kayaking river", createdBy: 'system' },
    { name: "Paragliding from Gerlitzen", description: "Experience the thrill of a tandem paragliding flight from the Gerlitzen mountain, soaring over Lake Ossiach.", location: "Villach, Austria", duration: 2, dataAiHint: "paragliding alps", createdBy: 'system' },
];

const allActivities = [...viennaActivities, ...villachActivities];
const SEED_FLAG_VERSION = 'v6_added_paragliding';

async function seedDatabase() {
  if (!isFirebaseInitialized) {
    console.error("Firebase not initialized. Cannot seed database. Please check your .env file.");
    process.exit(1);
  }

  const flagRef = firestore.collection('_internal').doc(SEED_FLAG_VERSION);
  const flagDoc = await flagRef.get();

  if (flagDoc.exists) {
      console.log(`Database has already been seeded with version: ${SEED_FLAG_VERSION}. Halting.`);
      return;
  }
  
  console.log(`Starting database seed (version: ${SEED_FLAG_VERSION})...`);
  
  console.log("Deleting all old system-generated activities to ensure a clean slate...");
  const activitiesCollection = firestore.collection('activities');
  const query = activitiesCollection.where('createdBy', '==', 'system');
  
  await new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });

  const writeBatch = firestore.batch();
  let successCount = 0;

  for (const activityData of allActivities) {
    let imageUrl: string;
    try {
        console.log(` -> Generating AI image for "${activityData.name}"...`);
        imageUrl = await generateAndStoreActivityImage(
            activityData.name,
            activityData.location,
            activityData.dataAiHint
        );
    } catch(e) {
        console.warn(` -> Failed to generate AI image for "${activityData.name}". Falling back to placeholder.`);
        imageUrl = `https://placehold.co/400x250.png`;
    }

    let enhancedDetails = {};
    try {
        console.log(` -> Generating AI description for "${activityData.name}"...`);
        enhancedDetails = await generateActivityDescription({
            activityName: activityData.name,
            location: activityData.location,
        });
    } catch(e) {
        console.warn(` -> Failed to generate AI description for "${activityData.name}".`);
    }

    const docRef = activitiesCollection.doc();
    const newActivity: Activity = {
        ...(activityData as Omit<Activity, 'id'>),
        ...enhancedDetails,
        id: docRef.id,
        imageUrls: [imageUrl],
        modules: ['couples', 'friends', 'meet'],
        createdBy: 'system',
        likes: 0,
        dislikes: 0,
    };
    writeBatch.set(docRef, newActivity);
    successCount++;
    console.log(` -> Queued "${activityData.name}" for creation.`);
  }

  if (successCount > 0) {
      console.log(`Committing ${successCount} new activities to the database...`);
      await writeBatch.commit();
      console.log(`Successfully added ${successCount} new activities.`);
  } else {
      console.log("No new activities were processed to commit.");
  }
  
  await flagRef.set({ seededAt: new Date().toISOString(), version: SEED_FLAG_VERSION });
  
  console.log("Database seeding complete.");
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
    const snapshot = await query.limit(500).get();
  
    if (snapshot.size === 0) {
      console.log("No more old system activities to delete.");
      resolve(true);
      return;
    }
  
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  
    await batch.commit();
    console.log(`Deleted a batch of ${snapshot.size} old activities.`);
  
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
}

seedDatabase().catch(error => {
  console.error('Seeding script failed with a critical error:', error);
  process.exit(1);
});
