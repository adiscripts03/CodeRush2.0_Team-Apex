import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const affectedPopulationSchema = new Schema(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: "ImpactAssessment", required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    districtName: { type: String, required: true, trim: true },
    totalPopulation: { type: Number, required: true, min: 0 },
    exposedPopulation: { type: Number, required: true, min: 0 },
    exposurePercentage: { type: Number, required: true, min: 0, max: 100 },
    geometry: { type: Schema.Types.Mixed, required: true }
  },
  {
    ...timestamps,
    collection: "affected_populations"
  }
);

affectedPopulationSchema.index({ geometry: "2dsphere" });
affectedPopulationSchema.index({ assessmentId: 1, districtName: 1 });

export type AffectedPopulation = InferSchemaType<typeof affectedPopulationSchema>;

export const AffectedPopulationModel: Model<AffectedPopulation> =
  models.AffectedPopulation ?? model<AffectedPopulation>("AffectedPopulation", affectedPopulationSchema);
