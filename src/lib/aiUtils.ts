
'use server';

import { ai } from '@/ai/genkit';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { randomUUID } from 'crypto';
import { isFirebaseInitialized } from '@/lib/firebase';

/**
 * Generates an image using an AI model, compresses it, and uploads it to Firebase Storage.
 * This is a reusable utility function that can be called from server actions or standalone scripts.
 *
 * @param activityName - The name of the activity.
 * @param location - The location of the activity.
 * @param dataAiHint - Optional keywords for image generation.
 * @returns The public URL of the uploaded image.
 * @throws An error if image generation or upload fails.
 */
export async function generateAndStoreActivityImage(
  activityName: string,
  location: string,
  dataAiHint?: string
): Promise<string> {
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
          cacheControl: 'public, max-age=31536000',
      },
  });

  await file.makePublic();

  return file.publicUrl();
}
