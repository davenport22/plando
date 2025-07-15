
'use server';
/**
 * @fileOverview A Genkit flow for generating an activity image.
 *
 * - generateActivityImage - A function that generates and compresses an image for a travel activity.
 * - GenerateActivityImageInput - The input type for the function.
 * - GenerateActivityImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateAndStoreActivityImage } from '@/lib/aiUtils';

const GenerateActivityImageInputSchema = z.object({
  activityName: z.string().describe('The name of the travel activity (e.g., "Eiffel Tower Visit", "Cooking Class").'),
  location: z.string().describe('The location of the activity (e.g., "Paris, France").'),
  dataAiHint: z.string().optional().describe('Optional keywords for image generation (e.g., "eiffel tower" or "cooking class").'),
});
export type GenerateActivityImageInput = z.infer<
  typeof GenerateActivityImageInputSchema
>;

// The output is a string containing the public URL of the generated image.
const GenerateActivityImageOutputSchema = z.string().url().describe('The public URL of the generated image.');
export type GenerateActivityImageOutput = z.infer<
  typeof GenerateActivityImageOutputSchema
>;

export async function generateActivityImage(
  input: GenerateActivityImageInput
): Promise<GenerateActivityImageOutput> {
  return generateActivityImageFlow(input);
}

const generateActivityImageFlow = ai.defineFlow(
  {
    name: 'generateActivityImageFlow',
    inputSchema: GenerateActivityImageInputSchema,
    outputSchema: GenerateActivityImageOutputSchema,
  },
  async ({ activityName, location, dataAiHint }) => {
    // This flow now calls the reusable utility function.
    return await generateAndStoreActivityImage(activityName, location, dataAiHint);
  }
);
