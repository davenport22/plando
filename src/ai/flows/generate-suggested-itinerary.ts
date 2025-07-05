
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
              .enum(['Must Do', 'Optional'])
              .describe("Category based on the user's vote. 'Must Do' for liked activities, 'Optional' for disliked ones."),
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
  prompt: `You are an AI travel assistant. Your task is to generate a suggested itinerary based on a list of activities and their liked status.

The itinerary should balance the activity load per day and respect the trip's start and end dates.

**Use these absolute, non-negotiable rules for categorization:**
1.  If an activity's \`isLiked\` property is \`true\`, its category in the output MUST be 'Must Do'.
2.  If an activity's \`isLiked\` property is \`false\`, its category in the output MUST be 'Optional'.
3.  The category 'Recommended' MUST NOT be used.

This ensures all liked activities are treated with the highest priority and disliked ones are treated as secondary.

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

Generate a suggested itinerary in the required JSON format.
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
