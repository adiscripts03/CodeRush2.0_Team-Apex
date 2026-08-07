import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const floodSnapshotSchema = new Schema(
  {
    timestamp: { type: Date, required: true, unique: true },
    sourceImageId: { type: String, required: true, trim: true },
    totalAreaKm2: { type: Number, required: true, min: 0 },
    polygonCount: { type: Number, required: true, min: 0 },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },
    status: {
      type: String,
      enum: ["processed", "pending", "failed"],
      default: "processed",
      required: true
    }
  },
  {
    ...timestamps,
    collection: "flood_snapshots"
  }
);

floodSnapshotSchema.index({ timestamp: -1 });

export type FloodSnapshot = InferSchemaType<typeof floodSnapshotSchema>;

export const FloodSnapshotModel: Model<FloodSnapshot> =
  (mongoose.models.FloodSnapshot as any) ?? model<FloodSnapshot>("FloodSnapshot", floodSnapshotSchema);
