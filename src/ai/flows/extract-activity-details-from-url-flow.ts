
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
    .optional()
    .max(50)
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
  prompt: `You are an expert travel assistant that extracts information from web pages.
Analyze the content at the following URL: {{url}}

Extract the following details and return them in the specified JSON format:
1.  **name**: The official name of the place, event, or activity.
2.  **description**: A brief, engaging summary. Keep it under 200 characters.
3.  **location**: The general location, like the city or neighborhood.
4.  **duration**: If mentioned, the typical or suggested duration in hours. If not mentioned, you can estimate it based on the activity type (e.g., a museum visit is typically 2-3 hours).
5.  **address**: The specific street address, if you can find one.
6.  **dataAiHint**: Provide two concise keywords that best represent this activity for an image search (e.g., "eiffel tower" or "cooking class").

If the URL is a Google Maps link, extract the information for the specified location.
If it is a general webpage, summarize the main activity it describes. Be precise and concise.
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
