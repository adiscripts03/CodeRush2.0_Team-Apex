import mongoose from 'mongoose';

const hydroStationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['dam', 'river_gauge', 'lake_sensor'], required: true },
    locationName: { type: String, trim: true },
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
    capacityPercent: { type: Number, default: 0 },
    dischargeRateCumes: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['Normal', 'Orange Alert', 'Red Alert', 'Overflowing'], 
      default: 'Normal' 
    },
    lastReadingAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

hydroStationSchema.index({ location: '2dsphere' });

export default mongoose.model('HydroStation', hydroStationSchema);
