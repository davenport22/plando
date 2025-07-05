/**
 * @fileOverview A mock email service for development purposes.
 * In a production environment, this would be replaced with a real email provider
 * like SendGrid, Nodemailer, etc.
 */

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

/**
 * Mocks sending an email by logging its contents to the server console.
 * @param params - The email parameters.
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean }> {
    console.log("--- MOCK EMAIL ---");
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log("Body (HTML):");
    console.log(params.html);
    console.log("--- END MOCK EMAIL ---");

    // In a real implementation, you would have your email sending logic here.
    // For now, we'll just assume it's always successful.
    return { success: true };
}
