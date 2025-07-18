'use server';

import nodemailer from 'nodemailer';

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

const isEmailConfigured = !!(EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS && EMAIL_FROM);

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
        console.warn("\n\n--- 📧 SMTP SERVICE NOT CONFIGURED 📧 ---");
        console.warn("To send real emails, add your SMTP credentials to the .env file.");
        console.warn("Falling back to logging email content to the console instead of sending.");
        
        console.log("\n--- MOCK EMAIL ---");
        console.log(`To: ${params.to}`);
        console.log(`From: ${EMAIL_FROM || '"Plando App" <noreply@plando.app>'}`);
        console.log(`Subject: ${params.subject}`);
        console.log("\n--- HTML Body ---");
        console.log(params.html);
        console.log("--- END MOCK EMAIL ---\n\n");
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
        throw new Error(`Failed to send email. Please check your SMTP credentials in the .env file. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
