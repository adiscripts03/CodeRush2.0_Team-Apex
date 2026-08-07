import Alert from '../models/Alert.js';
import AuditLog from '../models/AuditLog.js';
import { sendEmail } from '../utils/mailer.js';

export const dispatchAlert = async (alertData) => {
  const { eventId, type, recipient, subject, message, humanApproved } = alertData;

  // STRICT REQUIREMENT: Alerts MUST be human approved
  if (!humanApproved) {
    throw new Error('EMERGENCY PROTOCOL VIOLATION: Alerts cannot be sent without explicit human approval.');
  }

  const alertRecord = new Alert({
    eventId,
    type,
    recipient,
    subject,
    message,
    status: 'pending'
  });

  try {
    if (type === 'email') {
      await sendEmail({
        to: recipient,
        subject: subject,
        text: message
      });
    } else {
      console.warn(`Alert type '${type}' is simulated and not connected to an external gateway.`);
    }

    alertRecord.status = 'sent';
    alertRecord.sentAt = new Date();
    await alertRecord.save();

    // Audit the human approval and send
    await AuditLog.create({
      eventType: 'alert',
      message: `Human-approved alert dispatched to ${recipient}`,
      details: { alertId: alertRecord._id, type, subject }
    });

    return alertRecord;

  } catch (error) {
    alertRecord.status = 'failed';
    alertRecord.errorLog = error.message;
    await alertRecord.save();

    throw new Error(`Failed to dispatch alert: ${error.message}`);
  }
};
