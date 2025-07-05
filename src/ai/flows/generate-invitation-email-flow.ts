'use server';
/**
 * @fileOverview A Genkit flow for generating a trip invitation email.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const GenerateInvitationEmailInputSchema = z.object({
  recipientEmail: z.string().email().describe("The email address of the person being invited."),
  tripName: z.string().describe("The name of the trip they are being invited to."),
  inviterName: z.string().describe("The name of the person who is sending the invitation."),
});
export type GenerateInvitationEmailInput = z.infer<typeof GenerateInvitationEmailInputSchema>;

export const GenerateInvitationEmailOutputSchema = z.object({
  subject: z.string().describe("The subject line for the invitation email."),
  body: z.string().describe("The HTML body of the invitation email. It should be friendly and welcoming, including a clear call-to-action to register for Plando. The registration link should be the root path '/'."),
});
export type GenerateInvitationEmailOutput = z.infer<typeof GenerateInvitationEmailOutputSchema>;

export async function generateInvitationEmail(
  input: GenerateInvitationEmailInput
): Promise<GenerateInvitationEmailOutput> {
  return generateInvitationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInvitationEmailPrompt',
  input: {schema: GenerateInvitationEmailInputSchema},
  output: {schema: GenerateInvitationEmailOutputSchema},
  prompt: `You are an assistant for a travel planning app called "Plando". Your task is to generate a friendly and engaging HTML email to invite a new user to join a trip.

The user {{recipientEmail}} has been invited by {{inviterName}} to join the trip: "{{tripName}}".

Generate a subject line and an HTML email body with the following requirements:
1.  **Subject:** Make it exciting and clear, like "You're invited to plan '{{tripName}}' on Plando!".
2.  **Body (HTML):**
    *   Start with a friendly greeting to the recipient.
    *   Clearly state that {{inviterName}} has invited them to collaborate on planning the "{{tripName}}" trip using Plando.
    *   Briefly explain that Plando is a fun app for planning adventures together.
    *   Include a prominent call-to-action (a button is preferred) that links to the registration page. The link should be to the root of the site: "/"
    *   Use simple, clean HTML with inline styles for basic formatting (e.g., bold text, button styling) to ensure compatibility.
    *   Sign off warmly from "The Plando Team".

Here is an example of the kind of HTML structure you could generate for the body:

\`\`\`html
<p>Hi {{recipientEmail}},</p>
<p>Great news! <strong>{{inviterName}}</strong> has invited you to join them in planning the "<strong>{{tripName}}</strong>" trip on Plando.</p>
<p>Plando is a collaborative app that makes planning your adventures easy and fun. To get started and see the trip details, you'll just need to create a free account.</p>
<a href="/" style="background-color: #1a73e8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Join the Trip on Plando</a>
<p>Happy planning!</p>
<p>Best,<br>The Plando Team</p>
\`\`\`
`,
});

const generateInvitationEmailFlow = ai.defineFlow(
  {
    name: 'generateInvitationEmailFlow',
    inputSchema: GenerateInvitationEmailInputSchema,
    outputSchema: GenerateInvitationEmailOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
