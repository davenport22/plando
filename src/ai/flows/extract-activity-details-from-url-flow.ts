
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
  prompt: `You are an information extraction engine. Your only task is to analyze the content of the webpage at the provided URL and fill in a JSON object.

**PRIMARY DIRECTIVE: Use ONLY information found on the webpage at {{url}}. Do NOT use your general knowledge, do NOT infer details, and do NOT perform any other searches.**

If the webpage is about a place, event, or activity that a person can visit or do, extract the following information. If the webpage is NOT about a specific, real-world activity (e.g., it's a corporate "about us" page, a blog post, a news article), you MUST still extract the page title as the 'name', but leave other activity-specific fields like 'duration' or 'location' blank unless they are explicitly mentioned in the context of an activity on that page.

**Instructions for all pages:**

1.  **name**: Extract the primary name of the place, event, or the title of the webpage.
2.  **description**: Summarize the content of the page. Keep it under 200 characters. If there is no clear summary, use the meta description of the page or the first few sentences.
3.  **location**: If a real-world city or neighborhood is clearly stated as the location of a business or event, extract it. Otherwise, omit this field.
4.  **address**: If a specific street address is stated on the page, extract it. Otherwise, omit it.
5.  **duration**: Only extract this if the page explicitly mentions a duration for an activity in hours (e.g., "Tour takes 2 hours"). Otherwise, you MUST omit this field.
6.  **dataAiHint**: Provide two concise keywords based *only* on the page's main subject for an image search (e.g., "eiffel tower" or "design studio").

**Special instructions for Google Maps links (maps.google.com, maps.app.goo.gl, etc.):**
- Focus ONLY on the primary point of interest named in the page title.
- IGNORE all other sections like "You might also like", reviews, or nearby places.

Your output must be precise and based *only* on the provided webpage.
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
