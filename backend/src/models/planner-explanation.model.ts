import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const plannerExplanationSchema = new Schema(
  {
    recommendationId: { type: String, required: true, index: true, trim: true },
    timestamp: { type: Date, required: true },
    observeSummary: { type: Schema.Types.Mixed, default: {} },
    estimateSummary: { type: Schema.Types.Mixed, default: {} },
    explainUncertainty: {
      confidence: { type: Number, required: true, min: 0, max: 1 },
      factors: [{ type: String }]
    },
    planSummary: { type: Schema.Types.Mixed, default: {} },
    reviewCriteria: [{ type: String }]
  },
  {
    ...timestamps,
    collection: "planner_explanations"
  }
);

plannerExplanationSchema.index({ timestamp: -1 });

export type PlannerExplanation = InferSchemaType<typeof plannerExplanationSchema>;

export const PlannerExplanationModel: Model<PlannerExplanation> =
  (mongoose.models.PlannerExplanation as any) ?? model<PlannerExplanation>("PlannerExplanation", plannerExplanationSchema);
