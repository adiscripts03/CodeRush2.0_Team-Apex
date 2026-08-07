import mongoose from 'mongoose';

const floodEventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { 
      type: String, 
      enum: ['active', 'monitoring', 'resolved'], 
      default: 'active' 
    },
    region: { type: String, required: true },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      default: 'high' 
    }
  },
  { timestamps: true }
);

export default mongoose.model('FloodEvent', floodEventSchema);
