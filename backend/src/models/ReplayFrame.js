import mongoose from 'mongoose';

const replayFrameSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'FloodEvent', required: true },
    frameIndex: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    label: { type: String }, // e.g., '14:00 IST'
    dataGap: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    hazardPolygon: { type: mongoose.Schema.Types.ObjectId, ref: 'FloodPolygon' },
    simulatedData: {
      type: mongoose.Schema.Types.Mixed,
      description: 'Snapshot of sensor readings, weather data, etc. at this exact time.'
    }
  },
  { timestamps: true }
);

// Ensure frame sequence is easily queryable per event
replayFrameSchema.index({ eventId: 1, frameIndex: 1 }, { unique: true });

export default mongoose.model('ReplayFrame', replayFrameSchema);
