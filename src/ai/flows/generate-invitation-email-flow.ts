
'use server';
/**
 * @fileOverview A Genkit flow for generating a trip invitation email.
 * This file now handles HTML body construction directly for reliability.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateInvitationEmailInputSchema = z.object({
  recipientEmail: z.string().email().describe("The email address of the person being invited."),
  tripName: z.string().describe("The name of the trip they are being invited to."),
  tripId: z.string().describe("The unique ID of the trip."),
  inviterName: z.string().describe("The name of the person who is sending the invitation."),
});
export type GenerateInvitationEmailInput = z.infer<typeof GenerateInvitationEmailInputSchema>;

// The output schema now includes the code-generated HTML body.
const GenerateInvitationEmailOutputSchema = z.object({
  subject: z.string().describe("The AI-generated subject line for the invitation email."),
  body: z.string().describe("The code-generated HTML body of the invitation email."),
});
export type GenerateInvitationEmailOutput = z.infer<typeof GenerateInvitationEmailOutputSchema>;

// Internal schema for what the AI will actually generate.
const AiOutputSchema = z.object({
    subject: z.string().describe("An exciting and clear subject line, like \"You're invited to plan '{{tripName}}' on Plando!\"."),
});


/**
 * Generates an invitation email with an AI-powered subject and a reliable, code-generated HTML body.
 * @param input The details for the invitation.
 * @returns A promise that resolves to the email subject and body.
 */
export async function generateInvitationEmail(
  input: GenerateInvitationEmailInput
): Promise<GenerateInvitationEmailOutput> {
  return generateInvitationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInvitationEmailSubjectPrompt', // Updated name to reflect new purpose
  input: {schema: GenerateInvitationEmailInputSchema},
  output: {schema: AiOutputSchema},
  prompt: `You are an assistant for a travel planning app called "Plando". Your ONLY task is to generate a friendly and engaging email **subject line** to invite a new user to join a trip.

**CONTEXT:**
- Inviter: {{inviterName}}
- Recipient: {{recipientEmail}}
- Trip Name: "{{tripName}}"

**REQUIREMENT:**
- Generate an exciting and clear subject line, for example: "You're invited to plan '{{tripName}}' on Plando!".
`,
});

const generateInvitationEmailFlow = ai.defineFlow(
  {
    name: 'generateInvitationEmailFlow',
    inputSchema: GenerateInvitationEmailInputSchema,
    outputSchema: GenerateInvitationEmailOutputSchema,
  },
  async (input) => {
    // 1. Get the subject line from the AI.
    const {output} = await prompt(input);
    if (!output?.subject) {
        // Provide a reliable fallback subject if AI fails.
        output.subject = `You're invited to join the trip: ${input.tripName}`;
    }

    // 2. Construct the HTML body reliably in code.
    const body = `
      <p>Hi there,</p>
      <p>Great news! <strong>${input.inviterName}</strong> has invited you to join them in planning the "<strong>${input.tripName}</strong>" trip on Plando.</p>
      <p>Click the button below to sign up or log in. Afterwards, go to the "My Trips" page and enter the following Trip ID to join:</p>
      <p style="font-size: 1.5em; font-weight: bold; letter-spacing: 2px; text-align: center; padding: 10px; border: 1px dashed #ccc; background-color: #f9f9f9;">${input.tripId}</p>
      <a href="https://6000-firebase-studio-1750279304267.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev/" style="background-color: #1a73e8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Go to Plando</a>
      <p>Happy planning!</p>
      <p>Best,<br>The Plando Team</p>
    `;

    // 3. Return the final object with AI subject and code-generated body.
    return {
        subject: output.subject,
        body: body,
    };
  }
);
