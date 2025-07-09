
'use server';
/**
 * @fileOverview A Genkit flow for generating a destination image.
 *
 * - generateDestinationImage - A function that generates and compresses an image for a travel destination.
 * - GenerateDestinationImageInput - The input type for the generateDestinationImage function.
 * - GenerateDestinationImageOutput - The return type for the generateDestinationImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';
import { isFirebaseInitialized } from '@/lib/firebase';

const GenerateDestinationImageInputSchema = z.object({
  destination: z.string().describe('The travel destination (e.g., city, country).'),
});
export type GenerateDestinationImageInput = z.infer<
  typeof GenerateDestinationImageInputSchema
>;

// The output is just a string containing the public URL of the generated and stored image.
const GenerateDestinationImageOutputSchema = z.string().url().describe('The public URL of the generated image.');
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
    if (!isFirebaseInitialized) {
        throw new Error('Firebase Storage is not initialized. Cannot upload image.');
    }
      
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

    const parts = media.url.split(',');
    const base64Data = parts[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const compressedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 600 })
      .jpeg({ quality: 75 })
      .toBuffer();

    const bucket = getStorage().bucket();
    const fileName = `images/destinations/${randomUUID()}.jpeg`;
    const file = bucket.file(fileName);

    await file.save(compressedImageBuffer, {
        metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
    });
    
    // Using makePublic is simpler but you can also use getSignedUrl for more control
    await file.makePublic();

    return file.publicUrl();
  }
);
