import * as alertService from '../services/alertService.js';

export const sendAlert = async (req, res, next) => {
  try {
    const { eventId, type, recipient, subject, message, humanApproved } = req.body;

    const alertResult = await alertService.dispatchAlert({
      eventId,
      type,
      recipient,
      subject,
      message,
      humanApproved
    });

    res.status(201).json({
      success: true,
      message: 'Alert successfully processed and dispatched.',
      data: alertResult
    });
  } catch (error) {
    // Return a 403 Forbidden if it's a protocol violation (lack of approval)
    if (error.message.includes('PROTOCOL VIOLATION')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};
