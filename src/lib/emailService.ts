'use server';

import nodemailer from 'nodemailer';

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

const isEmailConfigured = EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS && EMAIL_FROM;

let transporter: nodemailer.Transporter;

if (isEmailConfigured) {
    transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT),
        secure: Number(EMAIL_PORT) === 465, // true for 465, false for other ports
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });
}

/**
 * Sends an email using Nodemailer if configured, otherwise logs to console.
 * @param params - The email parameters.
 * @returns A promise that resolves to an object indicating success.
 * @throws An error if email sending fails.
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean }> {
    if (!isEmailConfigured) {
        console.warn("--- EMAIL SERVICE (SMTP) NOT CONFIGURED ---");
        console.warn("To send real emails, add your SMTP credentials to the .env file.");
        console.warn("Falling back to logging email content to the console instead of sending.");
        console.warn("\n--- Example .env Configurations ---");
        console.warn("For SendGrid (Recommended):");
        console.warn('EMAIL_HOST="smtp.sendgrid.net"');
        console.warn('EMAIL_PORT=587');
        console.warn('EMAIL_USER="apikey"');
        console.warn('EMAIL_PASS="YOUR_SENDGRID_API_KEY"');
        console.warn('EMAIL_FROM="Your App Name <you@yourdomain.com>"');
        console.warn("\nFor Gmail (Development/Testing Only - requires App Password):");
        console.warn('EMAIL_HOST="smtp.gmail.com"');
        console.warn('EMAIL_PORT=587');
        console.warn('EMAIL_USER="your-email@gmail.com"');
        console.warn('EMAIL_PASS="your-16-character-app-password"');
        console.warn('EMAIL_FROM="Your Name <your-email@gmail.com>"');
        console.warn("----------------------------------\n");
        
        console.log("Mock Email Sent:");
        console.log("To: ", params.to);
        console.log("Subject: ", params.subject);
        console.log("Body (HTML): ", params.html);
        console.warn("--- END MOCK EMAIL ---");
        return { success: true };
    }

    try {
        await transporter.sendMail({
            from: EMAIL_FROM, // Use the full "Name <email>" string from the .env file
            to: params.to,
            subject: params.subject,
            html: params.html,
        });
        console.log(`Email successfully sent to ${params.to}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to send email:", error);
        // In a real app, you might want more robust error handling or a fallback.
        // For now, we'll throw to make the issue visible in server logs.
        throw new Error(`Failed to send email. Please check your SMTP credentials in the .env file. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
