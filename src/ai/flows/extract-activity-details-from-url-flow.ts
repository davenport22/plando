'use server';
/**
 * @fileOverview A Genkit flow for extracting activity details from a URL.
 *
 * - extractActivityDetailsFromUrl - A function that takes a URL, fetches its content, and returns structured activity data.
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

// Internal schema for the content that the flow and prompt will process.
const PageContentInputSchema = z.object({
  pageContent: z.string().describe('The full HTML content of the webpage to be parsed.'),
});

/**
 * Fetches the content of a given URL, cleans it, and then passes it to an AI flow
 * to extract structured data about an activity.
 * @param input An object containing the URL to fetch.
 * @returns A promise that resolves to the extracted activity details.
 */
export async function extractActivityDetailsFromUrl(
  input: ExtractActivityDetailsFromUrlInput
): Promise<ExtractActivityDetailsFromUrlOutput> {
  try {
    const response = await fetch(input.url, {
        headers: {
            // Use a generic user-agent to avoid being blocked by some sites.
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL with status: ${response.status}`);
    }

    const pageContent = await response.text();
    
    // To speed up processing and improve reliability, we pre-process the HTML.
    // We remove large, irrelevant sections like script, style, and SVG tags.
    // This reduces the amount of data sent to the AI, making it faster and less likely to hit limits.
    const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const styleRegex = /<style\b[^<]*((?:<\/style>)<[^<]*)*<\/style>/gi;
    const svgRegex = /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi;

    const cleanedContent = pageContent
      .replace(scriptRegex, '')
      .replace(styleRegex, '')
      .replace(svgRegex, '')
      .replace(/\s{2,}/g, ' '); // Condense whitespace

    // Now call the underlying flow with the cleaned content.
    return await extractActivityDetailsFromUrlFlow({ pageContent: cleanedContent });
  } catch (error) {
    console.error("Error in extractActivityDetailsFromUrl:", error);
    if (error instanceof Error && error.message.includes("503")) {
        throw new Error("The AI service is currently busy. Please try again in a few moments.");
    }
    throw new Error(error instanceof Error ? error.message : "An unknown error occurred during URL fetch or processing.");
  }
}

const prompt = ai.definePrompt({
  name: 'extractActivityDetailsFromUrlPrompt',
  input: {schema: PageContentInputSchema},
  output: {schema: ExtractActivityDetailsFromUrlOutputSchema},
  prompt: `You are a highly precise information extraction engine. Your ONLY function is to analyze the provided HTML content of a webpage and fill a JSON object according to the following strict rules.

**NON-NEGOTIABLE CORE DIRECTIVES:**
1.  **USE ONLY THE PROVIDED CONTENT:** You MUST NOT use any external knowledge or perform any searches. All answers must be derived *exclusively* from the HTML content provided below between the <WEBPAGE_CONTENT> tags.
2.  **DO NOT INVENT:** If a piece of information is not in the provided content, you MUST omit the corresponding field in your output. Do not guess, assume, or create placeholder information.
3.  **MATCH THE SCHEMA:** Your output must strictly adhere to the requested JSON schema.

**EXTRACTION RULES BY FIELD:**

*   **\`name\`**: Always extract the primary name of the place, event, or the main title from the \`<title>\` tag or a primary \`<h1>\` tag. This field is required.
*   **\`description\`**: Provide a concise summary of the page's main content, under 200 characters. If no clear summary exists, use the page's meta description or the first few sentences of the main body.
*   **\`location\`**: OMIT this field unless a real-world city or neighborhood is explicitly stated as the location of a business or event in the content.
*   **\`address\`**: OMIT this field unless a specific street address is explicitly stated in the content.
*   **\`duration\`**: OMIT this field unless the content explicitly states a duration in hours for a specific activity (e.g., "Tour takes 2 hours"). Do not calculate or estimate.
*   **\`dataAiHint\`**: Provide two concise keywords based *only* on the page's main subject for an image search (e.g., "eiffel tower" or "design studio").

Your output must be precise and derived solely from the provided webpage content.

<WEBPAGE_CONTENT>
{{{pageContent}}}
</WEBPAGE_CONTENT>
`,
});

const extractActivityDetailsFromUrlFlow = ai.defineFlow(
  {
    name: 'extractActivityDetailsFromUrlFlow',
    inputSchema: PageContentInputSchema, // This flow now takes the raw page content.
    outputSchema: ExtractActivityDetailsFromUrlOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
