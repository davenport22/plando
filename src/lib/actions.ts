
'use server';

import { generateSuggestedItinerary, type GenerateSuggestedItineraryInput, type GenerateSuggestedItineraryOutput } from '@/ai/flows/generate-suggested-itinerary';
import { generateActivityDescription, type GenerateActivityDescriptionInput, type GenerateActivityDescriptionOutput } from '@/ai/flows/generate-activity-description-flow';
import type { ActivityInput } from '@/types';

// This function will be called from client components to generate the itinerary.
export async function suggestItineraryAction(
  tripId: string,
  activities: ActivityInput[],
  startDate: string,
  endDate: string
): Promise<GenerateSuggestedItineraryOutput | { error: string }> {
  try {
    if (!activities || activities.length === 0) {
      return { error: "No activities provided to generate an itinerary." };
    }
    if (!startDate || !endDate) {
      return { error: "Start and end dates are required."}
    }

    const input: GenerateSuggestedItineraryInput = {
      activities,
      startDate,
      endDate,
    };

    console.log("Calling generateSuggestedItinerary with input:", JSON.stringify(input, null, 2));

    const result = await generateSuggestedItinerary(input);
    
    console.log("Received itinerary from AI:", JSON.stringify(result, null, 2));
    
    // Validate or transform the result if needed
    if (!result || !result.itinerary) {
        console.error("AI did not return a valid itinerary structure.");
        return { error: "Failed to generate itinerary: AI returned invalid data." };
    }
    
    return result;

  } catch (error) {
    console.error("Error generating itinerary:", error);
    // Check if error is an instance of Error and has a message property
    if (error instanceof Error) {
        return { error: `Failed to generate itinerary: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating the itinerary." };
  }
}


export async function enhanceActivityDescriptionAction(
  activityName: string,
  location: string
): Promise<GenerateActivityDescriptionOutput | { error: string }> {
  try {
    if (!activityName || !location) {
      return { error: "Activity name and location are required to enhance description." };
    }

    const input: GenerateActivityDescriptionInput = {
      activityName,
      location,
    };

    // console.log("Calling generateActivityDescription with input:", JSON.stringify(input, null, 2));
    const result = await generateActivityDescription(input);
    // console.log("Received enhanced description from AI:", JSON.stringify(result, null, 2));

    if (!result || !result.description) {
      console.error("AI did not return a valid description.");
      return { error: "Failed to generate enhanced description: AI returned invalid data." };
    }
    return result;

  } catch (error) {
    console.error("Error generating enhanced activity description:", error);
    if (error instanceof Error) {
      return { error: `Failed to generate enhanced description: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating the enhanced description." };
  }
}
