
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
import sharp from 'sharp';

const GenerateActivityImageInputSchema = z.object({
  activityName: z.string().describe('The name of the travel activity (e.g., "Eiffel Tower Visit", "Cooking Class").'),
  location: z.string().describe('The location of the activity (e.g., "Paris, France").'),
  dataAiHint: z.string().optional().describe('Optional keywords for image generation (e.g., "eiffel tower" or "cooking class").'),
});
export type GenerateActivityImageInput = z.infer<
  typeof GenerateActivityImageInputSchema
>;

// The output is just a string containing the data URI of the generated image.
const GenerateActivityImageOutputSchema = z.string().describe('The data URI of the generated image.');
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
    // Prefer dataAiHint if available as it's more specific for image searching
    const promptQuery = dataAiHint || `${activityName} in ${location}`;
    
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A beautiful, vibrant, photorealistic image of ${promptQuery}. travel photography, high quality, stunning view. Do not include text or people unless it's essential for the activity.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a media object.');
    }

    // Deconstruct the data URI
    const parts = media.url.split(',');
    const base64Data = parts[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Resize and compress the image using sharp
    const compressedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 400 }) // Resize to a max width of 400px for card view
      .jpeg({ quality: 75 }) // Convert to JPEG with 75% quality
      .toBuffer();

    const compressedBase64 = compressedImageBuffer.toString('base64');
    const compressedDataUri = `data:image/jpeg;base64,${compressedBase64}`;

    return compressedDataUri;
  }
);
