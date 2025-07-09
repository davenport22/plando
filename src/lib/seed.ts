
'use server';

import type { Activity } from '@/types';
import { firestore } from '@/lib/firebase';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';

// A list of predefined activities to seed into the database.
const viennaDateIdeas: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes'>[] = [
  {
    name: "Date at Haus des Meeres",
    location: "Vienna, Austria",
    description: "Explore the fascinating underwater and tropical world at the Aqua Terra Zoo and enjoy a breathtaking 360° view over Vienna from the rooftop bar.",
    duration: 3,
    dataAiHint: "aquarium vienna",
  },
  {
    name: "Dinner in the Dark",
    location: "Vienna, Austria",
    description: "A unique culinary experience where you dine in complete darkness, heightening your senses of taste and smell. An unforgettable adventure for your taste buds.",
    duration: 2.5,
    dataAiHint: "romantic dinner",
  },
  {
    name: "Relaxing Day at Therme Wien",
    location: "Vienna, Austria",
    description: "Escape the city stress and relax in the modern thermal baths of Therme Wien. Enjoy various pools, saunas, and wellness treatments.",
    duration: 4,
    dataAiHint: "thermal spa",
  },
  {
    name: "Goldsmith Workshop for Couples",
    location: "Vienna, Austria",
    description: "Create your own unique pieces of jewelry together in a goldsmith workshop. A creative and personal experience to craft lasting memories.",
    duration: 4,
    dataAiHint: "jewelry workshop",
  },
  {
    name: "Time Travel Vienna History Tour",
    location: "Vienna, Austria",
    description: "Embark on an adventurous journey through the history of Vienna. An interactive experience with a 5D cinema, animatronics, and virtual reality.",
    duration: 1.5,
    dataAiHint: "vienna history",
  },
  {
    name: "Fun at the Prater Amusement Park",
    location: "Vienna, Austria",
    description: "Enjoy the nostalgic atmosphere of the Vienna Prater amusement park. Take a romantic ride on the famous Wiener Riesenrad for a classic Vienna experience.",
    duration: 3,
    dataAiHint: "amusement park vienna",
  },
  {
    name: "Stroll through Schönbrunn Gardens",
    location: "Vienna, Austria",
    description: "Discover the magnificent Schönbrunn Palace and its vast, beautiful gardens. Perfect for a romantic walk and feeling like royalty for a day.",
    duration: 2.5,
    dataAiHint: "schonbrunn palace",
  },
  {
    name: "View from the Donauturm (Danube Tower)",
    location: "Vienna, Austria",
    description: "Experience a spectacular panoramic view of Vienna from the Danube Tower. Enjoy a coffee or dinner in the slowly rotating restaurant high above the city.",
    duration: 2,
    dataAiHint: "vienna skyline",
  },
];


// This function seeds the 'couplesActivities' collection with predefined data.
// It checks if an activity with the same name already exists to prevent duplicates.
export async function seedCouplesActivities() {
  const activitiesCollection = firestore.collection('couplesActivities');
  
  console.log("Starting to seed couples activities...");

  for (const activityData of viennaDateIdeas) {
    try {
      const querySnapshot = await activitiesCollection.where('name', '==', activityData.name).limit(1).get();
      
      if (querySnapshot.empty) {
        // Activity does not exist, so let's add it.
        const docRef = activitiesCollection.doc();
        
        // Generate an image for the activity
        let imageUrl = `https://placehold.co/400x250.png`;
        try {
            const generatedUrl = await generateActivityImage({
                activityName: activityData.name,
                location: activityData.location,
                dataAiHint: activityData.dataAiHint,
            });
            if (generatedUrl) {
                imageUrl = generatedUrl;
            }
        } catch (aiError) {
            console.warn(`AI image generation failed for "${activityData.name}", falling back to placeholder.`, aiError);
        }

        const newActivity: Activity = {
          ...activityData,
          id: docRef.id,
          imageUrls: [imageUrl],
          createdBy: 'system', // Indicates a seeded activity
          likes: 0,
          dislikes: 0,
        };
        
        await docRef.set(newActivity);
        console.log(`Successfully seeded activity: "${activityData.name}"`);
      } else {
        // console.log(`Activity "${activityData.name}" already exists. Skipping.`);
      }
    } catch (error) {
      console.error(`Error seeding activity "${activityData.name}":`, error);
    }
  }
  console.log("Finished seeding couples activities.");
}
