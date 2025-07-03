
'use server';
/**
 * @fileOverview A Genkit flow for generating a destination image.
 *
 * - generateDestinationImage - A function that generates an image for a travel destination.
 * - GenerateDestinationImageInput - The input type for the generateDestinationImage function.
 * - GenerateDestinationImageOutput - The return type for the generateDestinationImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDestinationImageInputSchema = z.object({
  destination: z.string().describe('The travel destination (e.g., city, country).'),
});
export type GenerateDestinationImageInput = z.infer<
  typeof GenerateDestinationImageInputSchema
>;

// The output is just a string containing the data URI of the generated image.
const GenerateDestinationImageOutputSchema = z.string().describe('The data URI of the generated image.');
export type GenerateDestinationImageOutput = z.infer<
  typeof GenerateDestinationImageOutputSchema
>;

export async function generateDestinationImage(
  input: GenerateDestinationImageInput
): Promise<GenerateDestinationImageOutput> {
  return generateDestinationImageFlow(input);
}

const generateDestinationImageFlow = ai.defineFlow(
  {
    name: 'generateDestinationImageFlow',
    inputSchema: GenerateDestinationImageInputSchema,
    outputSchema: GenerateDestinationImageOutputSchema,
  },
  async ({ destination }) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A beautiful, vibrant, photorealistic image of ${destination}. travel photography, high quality, stunning view, epic landscape.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a media object.');
    }

    return media.url;
  }
);
