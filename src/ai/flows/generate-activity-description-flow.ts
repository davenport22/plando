
'use server';
/**
 * @fileOverview A Genkit flow for generating an enhanced description for a travel activity.
 *
 * - generateActivityDescription - A function that generates an activity description.
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
  description: z.string().describe('The AI-generated enhanced description for the activity.'),
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

Provide a fresh, engaging, and concise summary (around 2-4 sentences, maximum 250 characters) for this activity.
Focus on what makes it unique or particularly interesting for a tourist.
Do not repeat the activity name or location in your response unless it's absolutely crucial for context.
Avoid starting with phrases like "This activity is..." or "Explore..." if possible, aim for more captivating language.
Example: For "Eiffel Tower Visit" in "Paris, France", a good response might be: "Experience breathtaking panoramic views of the City of Lights from its most iconic landmark. A symbol of romance and engineering marvel, it offers an unforgettable perspective day or night."
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
