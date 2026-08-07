import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const decisionRecordSchema = new Schema(
  {
    loopStage: {
      type: String,
      enum: [
        "observe",
        "estimate",
        "explain_uncertainty",
        "plan",
        "human_approval",
        "simulation_execution",
        "evaluation",
        "learning_report"
      ],
      required: true
    },
    hazardType: {
      type: String,
      enum: ["flood", "wildfire", "landslide", "cyclone", "earthquake"],
      required: true
    },
    correlationId: { type: String, required: true, trim: true },
    inputRefs: [{ type: Schema.Types.ObjectId, refPath: "inputRefModels" }],
    inputRefModels: [{ type: String }],
    output: { type: Schema.Types.Mixed, required: true },
    uncertainty: {
      confidence: { type: Number, min: 0, max: 1, required: true },
      factors: [{ type: String }]
    },
    requiresHumanApproval: { type: Boolean, default: true, required: true },
    approvalRef: { type: Schema.Types.ObjectId, ref: "HumanApproval" }
  },
  {
    ...timestamps,
    collection: "decision_records"
  }
);

decisionRecordSchema.index({ correlationId: 1, createdAt: 1 });
decisionRecordSchema.index({ hazardType: 1, loopStage: 1, createdAt: -1 });

export type DecisionRecord = InferSchemaType<typeof decisionRecordSchema>;

export const DecisionRecordModel: Model<DecisionRecord> =
  models.DecisionRecord ?? model<DecisionRecord>("DecisionRecord", decisionRecordSchema);
