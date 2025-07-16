'use server';
/**
 * @fileOverview A Genkit flow for generating a trip invitation email.
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

const GenerateInvitationEmailOutputSchema = z.object({
  subject: z.string().describe("The subject line for the invitation email."),
  body: z.string().describe("The HTML body of the invitation email. It should be friendly and welcoming, including a clear call-to-action to register for Plando. The registration link MUST be to '/register?tripId={{tripId}}'."),
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

**CRITICAL INSTRUCTION:** The 'body' field of your output MUST be valid HTML.

**CONTEXT:**
- Inviter: {{inviterName}}
- Recipient: {{recipientEmail}}
- Trip Name: "{{tripName}}"
- Trip ID: {{tripId}}

**REQUIREMENTS:**
1.  **Subject:** Make it exciting and clear, like "You're invited to plan '{{tripName}}' on Plando!".
2.  **Body (HTML):**
    *   Start with a friendly greeting to the recipient.
    *   Clearly state that {{inviterName}} has invited them to collaborate on planning the "{{tripName}}" trip using Plando.
    *   Briefly explain that Plando is a fun app for planning adventures together.
    *   **NON-NEGOTIABLE:** You MUST include a prominent call-to-action button that links to the registration page.
    *   The link's \`href\` attribute MUST be exactly \`/register?tripId={{tripId}}\`.
    *   Use simple, clean HTML with inline styles for basic formatting.
    *   Sign off warmly from "The Plando Team".

**STRICT HTML TEMPLATE FOR THE BODY - YOU MUST FOLLOW THIS STRUCTURE:**

\`\`\`html
<p>Hi there,</p>
<p>Great news! <strong>{{inviterName}}</strong> has invited you to join them in planning the "<strong>{{tripName}}</strong>" trip on Plando.</p>
<p>Plando is a collaborative app that makes planning your adventures easy and fun. To get started and see the trip details, you'll just need to create a free account. You will automatically be added to the trip after you sign up!</p>
<a href="/register?tripId={{tripId}}" style="background-color: #1a73e8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Join the Trip on Plando</a>
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
