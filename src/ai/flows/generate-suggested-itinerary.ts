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
  prompt: `You are an AI travel assistant that generates a suggested itinerary based on a list of activities and their details, taking into account their duration, location and liked status.

  The itinerary should balance the activity load per day, and consider the start and end dates of the trip.
  Activities should be categorized as Must Do, Recommended, or Optional based on popularity (liked status).

  Here are the activities:
  {{#each activities}}
  - Name: {{name}}, Duration: {{duration}} hours, Location: {{location}}, Liked: {{isLiked}}
  {{/each}}

  Trip Start Date: {{startDate}}
  Trip End Date: {{endDate}}

  Generate a suggested itinerary in JSON format:
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
