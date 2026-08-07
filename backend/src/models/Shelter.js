import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['school', 'community_hall', 'stadium', 'other'], default: 'other' },
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
    maxCapacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    hasPower: { type: Boolean, default: true },
    hasWater: { type: Boolean, default: true },
    status: { 
      type: String, 
      enum: ['active', 'full', 'at-risk', 'closed'], 
      default: 'active' 
    },
    district: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactPhone: { type: String, trim: true }
  },
  { timestamps: true }
);

shelterSchema.index({ location: '2dsphere' });

export default mongoose.model('Shelter', shelterSchema);
