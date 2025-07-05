
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a suggested itinerary based on liked activities.
 *
 * - generateSuggestedItinerary - A function that generates a suggested itinerary.
 * - GenerateSuggestedItineraryInput - The input type for the generateSuggestedItinerary function.
 * - GenerateSuggestedItineraryOutput - The return type for the generateSuggestedItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSuggestedItineraryInputSchema = z.object({
  activities: z
    .array(
      z.object({
        name: z.string(),
        duration: z.number().describe('Duration of the activity in hours'),
        location: z.string(),
        isLiked: z.boolean(),
      })
    )
    .describe('A list of activities with their details and liked status.'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the trip (YYYY-MM-DD).'),
});
export type GenerateSuggestedItineraryInput = z.infer<
  typeof GenerateSuggestedItineraryInputSchema
>;

const GenerateSuggestedItineraryOutputSchema = z.object({
  itinerary: z
    .array(
      z.object({
        date: z.string().describe('The date of the itinerary (YYYY-MM-DD).'),
        activities: z.array(
          z.object({
            name: z.string(),
            startTime: z.string().describe('The start time of the activity (HH:mm).'),
            duration: z
              .number()
              .describe('Duration of the activity in hours.'),
            location: z.string(),
            category: z
              .enum(['Must Do', 'Recommended', 'Optional'])
              .describe('Category based on group votes.'),
            likes: z.number().describe('Number of participants who liked this activity. Based on input, 1 if liked, 0 otherwise.'),
            dislikes: z.number().describe('Number of participants who disliked this activity. Based on input, 1 if disliked, 0 otherwise.'),
            description: z.string().optional().describe('Brief description of the activity.')
          })
        ),
      })
    )
    .describe('A suggested itinerary based on liked activities.'),
});
export type GenerateSuggestedItineraryOutput = z.infer<
  typeof GenerateSuggestedItineraryOutputSchema
>;

export async function generateSuggestedItinerary(
  input: GenerateSuggestedItineraryInput
): Promise<GenerateSuggestedItineraryOutput> {
  return generateSuggestedItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSuggestedItineraryPrompt',
  input: {schema: GenerateSuggestedItineraryInputSchema},
  output: {schema: GenerateSuggestedItineraryOutputSchema},
  prompt: `You are an AI travel assistant. Your task is to generate a suggested itinerary based on a list of activities, their duration, location, and the user's vote (liked status).

The itinerary should balance the activity load per day and respect the trip's start and end dates.

**Crucially, use the following rules for categorization:**
- If an activity has 'isLiked: true', you can categorize it as 'Must Do' or 'Recommended'. Prioritize these liked activities when building the schedule.
- If an activity has 'isLiked: false', it MUST be categorized as 'Optional'. Do not categorize disliked activities as 'Must Do' or 'Recommended'.

For each activity you include in the generated itinerary:
- If its 'isLiked' status in the input is true, set 'likes: 1' and 'dislikes: 0' in the output.
- If its 'isLiked' status in the input is false, set 'likes: 0' and 'dislikes: 1' in the output.
- Include a brief description for each activity if one can be inferred or is commonly known.

Here are the activities:
{{#each activities}}
- Name: {{name}}, Duration: {{duration}} hours, Location: {{location}}, Liked: {{isLiked}}
{{/each}}

Trip Start Date: {{startDate}}
Trip End Date: {{endDate}}

Generate a suggested itinerary in JSON format.
  `,
});

const generateSuggestedItineraryFlow = ai.defineFlow(
  {
    name: 'generateSuggestedItineraryFlow',
    inputSchema: GenerateSuggestedItineraryInputSchema,
    outputSchema: GenerateSuggestedItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
