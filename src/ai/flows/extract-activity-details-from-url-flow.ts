
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
    .optional()
    .describe('The general location (e.g., city, neighborhood) of the activity. OMIT THIS ENTIRELY if no location is mentioned.'),
  duration: z.coerce
    .number()
    .optional()
    .describe('The suggested or typical duration for the activity in hours. Example: 2.5. OMIT THIS ENTIRELY if no duration is mentioned.'),
  address: z
    .string()
    .optional()
    .describe('The specific street address, if available from the webpage. OMIT THIS ENTIRELY if no address is mentioned.'),
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
  prompt: `You are a highly precise information extraction engine. Your ONLY function is to analyze the content of the webpage at the provided URL and fill a JSON object according to the following strict rules.

**NON-NEGOTIABLE CORE DIRECTIVES:**
1.  **USE ONLY THE PROVIDED URL:** You MUST NOT use any external knowledge, perform searches, or infer information not explicitly present on the webpage at \`{{url}}\`.
2.  **DO NOT INVENT:** If a piece of information is not on the page, you MUST omit the corresponding field in your output. Do not guess, assume, or create placeholder information.
3.  **MATCH THE SCHEMA:** Your output must strictly adhere to the requested JSON schema.

**EXTRACTION RULES BY FIELD:**

*   **\`name\`**: Always extract the primary name of the place, event, or the main title of the webpage. This field is required.
*   **\`description\`**: Provide a concise summary of the page's main content, under 200 characters. If no clear summary exists, use the page's meta description or the first few sentences.
*   **\`location\`**: OMIT this field unless a real-world city or neighborhood is explicitly stated as the location of a business or event on the page.
*   **\`address\`**: OMIT this field unless a specific street address is explicitly stated on the page.
*   **\`duration\`**: OMIT this field unless the page explicitly states a duration in hours for a specific activity (e.g., "Tour takes 2 hours"). Do not calculate or estimate.
*   **\`dataAiHint\`**: Provide two concise keywords based *only* on the page's main subject for an image search (e.g., "eiffel tower" or "design studio").

**SPECIAL INSTRUCTIONS for GOOGLE MAPS links (e.g., maps.google.com, maps.app.goo.gl):**
*   Focus EXCLUSIVELY on the primary point of interest named in the page title.
*   You MUST IGNORE all other sections, including but not limited to: "You might also like," "People also search for," "Reviews," user photos, and nearby places. For example, if the page is for Buckingham Palace, extract ONLY its details, not a nearby pub mentioned in a review.

Your output must be precise and derived solely from the provided webpage.
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
