
'use server';

import type { Activity } from '@/types';
import { firestore } from '@/lib/firebase';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';

// A list of predefined activities to seed into the database.
const viennaDateIdeas: Omit<Activity, 'id' | 'imageUrls' | 'likes' | 'dislikes'>[] = [
    {
      name: "Explore the Naschmarkt",
      description: "Vienna's largest market offers a vibrant mix of international foods, local delicacies, and lively restaurants. A feast for the senses.",
      location: "Vienna, Austria",
      duration: 2.5,
      dataAiHint: "vienna market",
      createdBy: 'system',
    },
    {
      name: "Classical Concert at St. Anne's Church",
      description: "Experience the magic of Mozart and Beethoven in the stunning baroque ambiance of St. Anne's Church.",
      location: "Vienna, Austria",
      duration: 1.5,
      dataAiHint: "vienna church concert",
      createdBy: 'system',
    },
    {
      name: "Visit the Spanish Riding School",
      description: "Witness the famous Lipizzaner stallions perform their elegant ballet. A truly unique Viennese tradition.",
      location: "Vienna, Austria",
      duration: 2,
      dataAiHint: "vienna horses",
      createdBy: 'system',
    },
    {
      name: "Coffee and Cake at a Traditional Viennese Coffee House",
      description: "Indulge in classic pastries like Sachertorte or Apfelstrudel in a historic setting. A quintessential Vienna experience.",
      location: "Vienna, Austria",
      duration: 1.5,
      dataAiHint: "vienna coffee cake",
      createdBy: 'system',
    },
    {
      name: "Explore the MuseumsQuartier",
      description: "A vibrant cultural complex featuring modern art, architecture, and trendy cafes. Home to the Leopold Museum and MUMOK.",
      location: "Vienna, Austria",
      duration: 3,
      dataAiHint: "vienna museum art",
      createdBy: 'system',
    },
    {
      name: "Hike in the Vienna Woods (Wienerwald)",
      description: "Escape the city and enjoy a scenic hike through the beautiful Vienna Woods, offering great views and fresh air.",
      location: "Vienna, Austria",
      duration: 4,
      dataAiHint: "vienna woods forest",
      createdBy: 'system',
    },
    {
      name: "Wine Tasting at a Heurige (Wine Tavern)",
      description: "Sample local wines and traditional Austrian food at a cozy wine tavern on the outskirts of the city.",
      location: "Vienna, Austria",
      duration: 3.5,
      dataAiHint: "vienna vineyard wine",
      createdBy: 'system',
    },
    {
      name: "Attend the Vienna State Opera",
      description: "Experience a world-class opera or ballet performance in one of the world's leading opera houses.",
      location: "Vienna, Austria",
      duration: 3,
      dataAiHint: "vienna opera house",
      createdBy: 'system',
    },
    {
       name: "Date at Haus des Meeres",
       description: "Explore the Aqua Terra Zoo with its impressive shark tank and tropical house, followed by a drink at the stunning rooftop bar.",
       location: "Vienna, Austria",
       duration: 3,
       dataAiHint: "vienna aquarium",
       createdBy: 'system',
    },
    {
       name: "Dinner in the Dark",
       description: "A unique culinary journey where you dine in complete darkness, heightening your senses of taste and smell.",
       location: "Vienna, Austria",
       duration: 2.5,
       dataAiHint: "dark dining",
       createdBy: 'system',
    },
    {
       name: "Relaxing Day at Therme Wien",
       description: "Unwind together in one of Europe's most modern city thermal baths, offering various pools, saunas, and relaxation areas.",
       location: "Vienna, Austria",
       duration: 5,
       dataAiHint: "thermal spa",
       createdBy: 'system',
    },
    {
       name: "Goldsmith Workshop for Couples",
       description: "A creative and romantic experience where you can design and craft your own unique pieces of jewelry together.",
       location: "Vienna, Austria",
       duration: 4,
       dataAiHint: "jewelry making",
       createdBy: 'system',
    },
    {
       name: "Fun at the Prater Amusement Park",
       description: "Enjoy a nostalgic day out with thrilling rides, games, and a romantic trip on the famous Wiener Riesenrad (Ferris Wheel).",
       location: "Vienna, Austria",
       duration: 3.5,
       dataAiHint: "amusement park",
       createdBy: 'system',
    },
    {
       name: "Stroll through Schönbrunn Gardens",
       description: "A romantic walk through the magnificent gardens of the former imperial summer residence, with beautiful fountains and the Gloriette.",
       location: "Vienna, Austria",
       duration: 2.5,
       dataAiHint: "vienna palace garden",
       createdBy: 'system',
    },
    {
       name: "View from the Donauturm (Danube Tower)",
       description: "Enjoy breathtaking 360° panoramic views of Vienna from the observation deck or the rotating restaurant.",
       location: "Vienna, Austria",
       duration: 2,
       dataAiHint: "vienna city view",
       createdBy: 'system',
    }
];


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
