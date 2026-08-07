import mongoose from 'mongoose';

const floodPolygonSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'FloodEvent', required: true },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        required: true
      },
      coordinates: {
        type: Array, // Array of arrays of arrays of numbers for GeoJSON
        required: true
      }
    },
    source: { type: String, required: true }, // e.g., 'Dartmouth Flood Observatory'
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    recordedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// Index for geospatial queries
floodPolygonSchema.index({ geometry: '2dsphere' });
floodPolygonSchema.index({ eventId: 1, recordedAt: -1 });

export default mongoose.model('FloodPolygon', floodPolygonSchema);
