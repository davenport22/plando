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
        console.warn("--- EMAIL SERVICE NOT CONFIGURED ---");
        console.warn("Email credentials are not set in the .env file. Printing email to console instead.");
        console.log("To: ", params.to);
        console.log("Subject: ", params.subject);
        console.log("Body (HTML): ", params.html);
        console.warn("--- END MOCK EMAIL ---");
        // We return success here because for dev purposes, this is not a failure.
        // The invitation flow should still appear successful to the user.
        return { success: true };
    }

    try {
        await transporter.sendMail({
            from: EMAIL_FROM,
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
