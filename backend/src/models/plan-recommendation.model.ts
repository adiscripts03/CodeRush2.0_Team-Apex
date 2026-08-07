import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const alternativeSchema = new Schema(
  {
    action: { type: String, required: true },
    tradeOff: { type: String, required: true }
  },
  { _id: false }
);

const evidenceSchema = new Schema(
  {
    metric: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    source: { type: String, required: true }
  },
  { _id: false }
);

const planRecommendationSchema = new Schema(
  {
    recommendationId: { type: String, required: true, unique: true, trim: true },
    timestamp: { type: Date, required: true, index: true },
    actionType: {
      type: String,
      enum: [
        "open_shelter",
        "deploy_rescue_boats",
        "close_road",
        "send_medical_team",
        "prioritize_district",
        "schedule_review"
      ],
      required: true
    },
    targetName: { type: String, required: true, trim: true },
    targetId: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true
    },
    reasoning: { type: [String], required: true },
    evidence: { type: [evidenceSchema], required: true },
    confidenceScore: { type: Number, required: true, min: 0, max: 1 },
    constraints: { type: [String], required: true },
    alternatives: { type: [alternativeSchema], required: true },
    status: {
      type: String,
      enum: ["proposed", "approved", "rejected", "executed"],
      default: "proposed",
      required: true
    }
  },
  {
    ...timestamps,
    collection: "plan_recommendations"
  }
);

planRecommendationSchema.index({ timestamp: -1 });
planRecommendationSchema.index({ actionType: 1, targetId: 1 });

export type PlanRecommendation = InferSchemaType<typeof planRecommendationSchema>;

export const PlanRecommendationModel: Model<PlanRecommendation> =
  (mongoose.models.PlanRecommendation as any) ?? model<PlanRecommendation>("PlanRecommendation", planRecommendationSchema);
