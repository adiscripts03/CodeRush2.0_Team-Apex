import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    eventType: { 
      type: String, 
      required: true,
      enum: ['auth', 'data_update', 'plan', 'approval', 'alert', 'observation', 'system']
    },
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, if auth is implemented
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed }, // Flexible JSON payload for context
    ipAddress: { type: String }
  },
  { timestamps: true }
);

// We might want to automatically expire old logs in a real system
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // 30 days
auditLogSchema.index({ eventType: 1, timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
