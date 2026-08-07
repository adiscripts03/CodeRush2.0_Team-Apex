import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['clinic', 'hospital', 'regional'], default: 'hospital' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    totalBeds: { type: Number },
    availableBeds: { type: Number },
    hasEmergencyPower: { type: Boolean, default: true },
    status: { 
      type: String, 
      enum: ['operational', 'at-risk', 'evacuating', 'closed'], 
      default: 'operational' 
    },
    district: { type: String, trim: true }
  },
  { timestamps: true }
);

hospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', hospitalSchema);
