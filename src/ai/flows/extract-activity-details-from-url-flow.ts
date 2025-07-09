
'use server';
/**
 * @fileOverview A Genkit flow for extracting activity details from a URL.
 *
 * - extractActivityDetailsFromUrl - A function that takes a URL and returns structured activity data.
 * - ExtractActivityDetailsFromUrlInput - The input type for the function.
 * - ExtractActivityDetailsFromUrlOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractActivityDetailsFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage describing the activity.'),
});
export type ExtractActivityDetailsFromUrlInput = z.infer<
  typeof ExtractActivityDetailsFromUrlInputSchema
>;

const ExtractActivityDetailsFromUrlOutputSchema = z.object({
  name: z.string().describe('The name of the activity or place.'),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less.")
    .optional()
    .describe('A concise, engaging summary of the activity (max 200 characters).'),
  location: z
    .string()
    .describe('The general location (e.g., city, neighborhood) of the activity.'),
  duration: z.coerce
    .number()
    .optional()
    .describe('The suggested or typical duration for the activity in hours. Example: 2.5'),
  address: z
    .string()
    .optional()
    .describe('The specific street address, if available from the webpage.'),
  dataAiHint: z
    .string()
    .max(50)
    .optional()
    .describe('Two keywords for a search on Unsplash for a representative image. E.g., "museum art" or "eiffel tower".'),
});

export type ExtractActivityDetailsFromUrlOutput = z.infer<
  typeof ExtractActivityDetailsFromUrlOutputSchema
>;

export async function extractActivityDetailsFromUrl(
  input: ExtractActivityDetailsFromUrlInput
): Promise<ExtractActivityDetailsFromUrlOutput> {
  return extractActivityDetailsFromUrlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractActivityDetailsFromUrlPrompt',
  input: {schema: ExtractActivityDetailsFromUrlInputSchema},
  output: {schema: ExtractActivityDetailsFromUrlOutputSchema},
  prompt: `You are a meticulous information extraction assistant. Your task is to analyze the content *exclusively* from the webpage at the provided URL and extract specific details.

**CRITICAL RULE: You MUST use ONLY the information present on the webpage at {{url}}. Do NOT use your general knowledge, perform any other web searches, or infer information not explicitly stated on the page.** If a piece of information is not available on the page, you must omit it from the output.

**IMPORTANT INSTRUCTIONS FOR GOOGLE MAPS LINKS:**
If the URL is from Google Maps (e.g., includes maps.google.com, www.google.com/maps, or maps.app.goo.gl), your task is to identify the SINGLE, PRIMARY point of interest featured on the page.

You MUST COMPLETELY IGNORE all other information on the page, including but not limited to:
- "You might also like" sections
- "People also search for" lists
- Nearby places, hotels, or restaurants
- User reviews, ratings, and photos
- Advertisements

Focus ONLY on the place named in the main title of the map view. For example, if the URL is for "Buckingham Palace", extract details for Buckingham Palace and nothing else.

From the content of the given URL, extract the following details and return them in the specified JSON format:
1.  **name**: The official name of the place, event, or activity, as stated on the page.
2.  **description**: A brief, engaging summary copied or summarized *directly from the page content*. Keep it under 200 characters. If no suitable summary exists, omit it.
3.  **location**: The general location, like the city or neighborhood, as found on the page.
4.  **duration**: If mentioned *on the webpage*, the typical or suggested duration in hours. If it is not mentioned, omit this field entirely.
5.  **address**: The specific street address, if you can find one on the page.
6.  **dataAiHint**: Provide two concise keywords that best represent this activity based on the page content for an image search (e.g., "eiffel tower" or "cooking class").

Your extraction must be precise, concise, and based *only* on the provided webpage.
`,
});

const extractActivityDetailsFromUrlFlow = ai.defineFlow(
  {
    name: 'extractActivityDetailsFromUrlFlow',
    inputSchema: ExtractActivityDetailsFromUrlInputSchema,
    outputSchema: ExtractActivityDetailsFromUrlOutputSchema,
  },
  async input => {
    // Note: The model needs to be capable of accessing web content.
    // Gemini 1.5 is suitable for this.
    const {output} = await prompt(input);
    return output!;
  }
);
