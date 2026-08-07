import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

if (env.smtp.host && env.smtp.user) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port || 587,
    secure: env.smtp.port == 465, 
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
}

/**
 * Utility to send an email.
 * Ensures emails are only sent to demo recipients to avoid real panic.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  // SAFETY OVERRIDE: Prevent real emergency alerts to public.
  // In a real system, you'd check environment. Here we hardcode a demo safety mechanism.
  const isDemoRecipient = to.endsWith('@example.com') || to.endsWith('@test.com');
  const safeRecipient = isDemoRecipient ? to : 'demo-admin@example.com'; 

  const mailOptions = {
    from: `"Disaster Command AI" <${env.smtp.user || 'noreply@disastercommand.local'}>`,
    to: safeRecipient,
    subject: `[SIMULATION] ${subject}`,
    text: `*** THIS IS A SIMULATED DISASTER ALERT ***\n\n${text}`,
    html: `<strong>*** THIS IS A SIMULATED DISASTER ALERT ***</strong><br><br>${html || text}`,
  };

  if (!transporter) {
    console.warn("⚠️ SMTP not configured. Mocking email send:");
    console.warn(`To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
    return { messageId: 'mock-id-12345' };
  }

  return await transporter.sendMail(mailOptions);
};
