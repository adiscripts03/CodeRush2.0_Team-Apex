import mongoose from 'mongoose';

const roadSegmentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true }, // Not all road segments have names
    type: { type: String, enum: ['highway', 'arterial', 'local', 'bridge'], default: 'local' },
    geometry: {
      type: {
        type: String,
        enum: ['LineString', 'MultiLineString'],
        required: true
      },
      coordinates: {
        type: Array, // Array of coordinates for LineString
        required: true
      }
    },
    lengthKm: { type: Number },
    status: { 
      type: String, 
      enum: ['open', 'submerged', 'damaged', 'closed', 'cleared'], 
      default: 'open' 
    },
    waterDepthMeters: { type: Number, default: 0 }
  },
  { timestamps: true }
);

roadSegmentSchema.index({ geometry: '2dsphere' });

export default mongoose.model('RoadSegment', roadSegmentSchema);
