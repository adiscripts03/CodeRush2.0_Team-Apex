import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

/**
 * POST /api/send-alert
 * Dispatches emergency transactional email alert
 */
router.post('/', async (req, res) => {
  const { subject, message, recipientEmail } = req.body;

  if (!subject || !message || !recipientEmail) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: subject, message, or recipientEmail',
    });
  }

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // If SMTP credentials exist in .env, send real email via Nodemailer
    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Disaster Command Centre" <${smtpUser}>`,
        to: recipientEmail,
        subject: `[EMERGENCY ALERT] ${subject}`,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">🚨 DISASTER COMMAND SYSTEM ALERT</h2>
            <p><strong>Recipient:</strong> ${recipientEmail}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 1px solid #334155;" />
            <div style="background-color: #1e293b; padding: 15px; border-radius: 6px; font-size: 14px; line-height: 1.6;">
              ${message}
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">
              Historical Simulation Broadcast — Flood Emergency Replay Prototype.
            </p>
          </div>
        `,
      });

      return res.json({
        success: true,
        message: `Alert dispatched successfully via SMTP to ${recipientEmail}`,
      });
    }

    // Demo Transporter Fallback (logs dispatch cleanly)
    console.log(`[ALERT DISPATCHED TO ${recipientEmail}] ${subject}: ${message}`);
    return res.json({
      success: true,
      message: `Alert successfully queued & logged for ${recipientEmail} (SMTP simulation mode).`,
    });

  } catch (err) {
    console.error('Error sending email alert:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to deliver email: ${err.message}`,
    });
  }
});

export default router;
