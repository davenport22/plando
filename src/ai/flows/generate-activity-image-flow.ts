
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
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';
import { isFirebaseInitialized } from '@/lib/firebase';

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
     if (!isFirebaseInitialized) {
        throw new Error('Firebase Storage is not initialized. Cannot upload image.');
    }

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

    const parts = media.url.split(',');
    const base64Data = parts[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const compressedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 400 }) 
      .jpeg({ quality: 75 })
      .toBuffer();

    const bucket = getStorage().bucket();
    const fileName = `images/activities/${randomUUID()}.jpeg`;
    const file = bucket.file(fileName);

    await file.save(compressedImageBuffer, {
        metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
    });

    await file.makePublic();

    return file.publicUrl();
  }
);
