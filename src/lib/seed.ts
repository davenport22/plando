
'use server';

import type { Activity } from '@/types';
import { firestore } from '@/lib/firebase';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';

// A list of predefined activities to seed into the database.
// This list has been emptied to prevent automatic seeding.
const viennaDateIdeas: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes'>[] = [];


// This function seeds the 'couplesActivities' collection with predefined data.
// It checks if an activity with the same name already exists to prevent duplicates.
export async function seedCouplesActivities() {
  if (viennaDateIdeas.length === 0) {
    // console.log("No activities to seed.");
    return;
  }

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
