import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const detectionResultSchema = new Schema(
  {
    timestamp: { type: Date, required: true },
    algorithm: { type: String, required: true, default: "NDWI_SENTINEL_2" },
    parameters: {
      threshold: { type: Number, required: true, default: 0.3 },
      bandGreen: { type: String, required: true, default: "B03" },
      bandNir: { type: String, required: true, default: "B08" }
    },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },
    processedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    ...timestamps,
    collection: "detection_results"
  }
);

detectionResultSchema.index({ timestamp: -1 });

export type DetectionResult = InferSchemaType<typeof detectionResultSchema>;

export const DetectionResultModel: Model<DetectionResult> =
  (mongoose.models.DetectionResult as any) ?? model<DetectionResult>("DetectionResult", detectionResultSchema);
