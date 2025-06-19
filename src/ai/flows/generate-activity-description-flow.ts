
'use server';
/**
 * @fileOverview A Genkit flow for generating an enhanced description and details for a travel activity.
 *
 * - generateActivityDescription - A function that generates an activity description and details.
 * - GenerateActivityDescriptionInput - The input type for the generateActivityDescription function.
 * - GenerateActivityDescriptionOutput - The return type for the generateActivityDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActivityDescriptionInputSchema = z.object({
  activityName: z.string().describe('The name of the activity.'),
  location: z.string().describe('The location (e.g., city, country) of the activity.'),
});
export type GenerateActivityDescriptionInput = z.infer<
  typeof GenerateActivityDescriptionInputSchema
>;

const GenerateActivityDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('The AI-generated engaging summary for the activity (2-4 sentences, max 250 characters).'),
  suggestedDurationHours: z
    .number()
    .optional()
    .describe('Suggested or typical duration for the activity in hours. Example: 2.5'),
  bestTimeToVisit: z
    .string()
    .optional()
    .describe('Recommended time of day or season to visit. Example: "Mornings or late afternoons", "Spring or Autumn"'),
  estimatedPriceRange: z
    .string()
    .optional()
    .describe('Estimated price range for the activity. Example: "Free", "$10-20 per person", "Varies"'),
  address: z
    .string()
    .optional()
    .describe('A more specific address or landmark detail for the activity, if available and distinct from the input location.'),
});
export type GenerateActivityDescriptionOutput = z.infer<
  typeof GenerateActivityDescriptionOutputSchema
>;

export async function generateActivityDescription(
  input: GenerateActivityDescriptionInput
): Promise<GenerateActivityDescriptionOutput> {
  return generateActivityDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActivityDescriptionPrompt',
  input: {schema: GenerateActivityDescriptionInputSchema},
  output: {schema: GenerateActivityDescriptionOutputSchema},
  prompt: `You are a travel assistant. The user is looking at an activity named "{{activityName}}" in "{{location}}".

Provide the following information for this activity:
1.  description: A fresh, engaging, and concise summary (around 2-4 sentences, maximum 250 characters) for this activity. Focus on what makes it unique or particularly interesting for a tourist. Do not repeat the activity name or location in your summary unless it's absolutely crucial for context. Avoid starting with phrases like "This activity is..." or "Explore..." if possible, aim for more captivating language.
    Example: For "Eiffel Tower Visit" in "Paris, France", a good summary might be: "Experience breathtaking panoramic views of the City of Lights from its most iconic landmark. A symbol of romance and engineering marvel, it offers an unforgettable perspective day or night."

2.  suggestedDurationHours (optional): The typical or suggested duration for this activity in hours (e.g., 2, 3.5). If unknown, omit.

3.  bestTimeToVisit (optional): The best time of day or season to visit (e.g., "Mornings", "Late afternoon to avoid crowds", "Spring for cherry blossoms"). If unknown or not applicable, omit.

4.  estimatedPriceRange (optional): An estimated price range (e.g., "Free", "$10-25 per person", "€50 entry", "Varies based on tour"). If unknown or widely variable and hard to summarize, omit.

5.  address (optional): If there's a more specific address, landmark, or district than "{{location}}" that's highly relevant, provide it. Otherwise, omit.

Return the information in the specified JSON format.
`,
});

const generateActivityDescriptionFlow = ai.defineFlow(
  {
    name: 'generateActivityDescriptionFlow',
    inputSchema: GenerateActivityDescriptionInputSchema,
    outputSchema: GenerateActivityDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
