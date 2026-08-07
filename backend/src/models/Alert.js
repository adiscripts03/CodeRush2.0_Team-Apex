import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'FloodEvent' },
    type: { type: String, enum: ['email', 'sms', 'push', 'system'], required: true },
    recipient: { type: String, required: true }, // email address, phone number, etc.
    subject: { type: String }, // Mostly for emails
    message: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'sent', 'failed'], 
      default: 'pending' 
    },
    sentAt: { type: Date },
    errorLog: { type: String }
  },
  { timestamps: true }
);

alertSchema.index({ eventId: 1, status: 1 });

export default mongoose.model('Alert', alertSchema);
