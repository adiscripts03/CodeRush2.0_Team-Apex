// backend/src/services/x402Logger.js
// Structured payment event logging for x402
//
// Logs payment events with [x402] prefix for easy filtering.
// If MongoDB is connected, persists payment records to the PaymentTransaction collection.

import mongoose from 'mongoose';

/**
 * Log a payment event to the console with structured formatting.
 * @param {string} event - Event type (e.g., 'request', 'payment_required', 'verified', 'settled')
 * @param {Object} details - Event details
 */
export function logPaymentEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  const safeDetails = { ...details };

  // Never log sensitive data
  delete safeDetails.privateKey;
  delete safeDetails.secret;
  delete safeDetails.facilitatorSecret;
  delete safeDetails.rawPaymentPayload;

  console.log(`[x402] [${timestamp}] ${event}`, JSON.stringify(safeDetails, null, 0));
}

/**
 * Persist a payment transaction record to MongoDB (if connected).
 * @param {Object} record - Payment record to persist
 * @returns {Promise<void>}
 */
export async function persistPaymentRecord(record) {
  // Only persist if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    logPaymentEvent('skip_persist', { reason: 'MongoDB not connected' });
    return;
  }

  try {
    // Lazy-import to avoid errors when MongoDB is not connected
    const { default: PaymentTransaction } = await import('../models/PaymentTransaction.js');
    await PaymentTransaction.create({
      payerAddress:     record.payerAddress || 'unknown',
      recipientAddress: record.recipientAddress || '',
      endpoint:         record.endpoint || '',
      httpMethod:       record.httpMethod || '',
      amount:           record.amount || '',
      asset:            record.asset || 'USDC',
      network:          record.network || '',
      txHash:           record.txHash || '',
      status:           record.status || 'settled',
      timestamp:        new Date(),
    });
    logPaymentEvent('persisted', { endpoint: record.endpoint, txHash: record.txHash });
  } catch (err) {
    // Non-fatal — log but don't crash
    console.error('[x402] Failed to persist payment record:', err.message);
  }
}
