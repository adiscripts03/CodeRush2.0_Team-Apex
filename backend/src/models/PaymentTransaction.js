// backend/src/models/PaymentTransaction.js
// Mongoose model for persisting x402 payment receipts.
// Only used when MongoDB is connected — the app runs fine without it.

import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
  payerAddress: {
    type: String,
    required: true,
    index: true,
  },
  recipientAddress: {
    type: String,
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
    index: true,
  },
  httpMethod: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  asset: {
    type: String,
    default: 'USDC',
  },
  network: {
    type: String,
    required: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'settled', 'failed', 'rejected'],
    default: 'settled',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Do not store private keys or raw payment signatures
paymentTransactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;
