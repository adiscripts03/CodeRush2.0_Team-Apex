import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";

const evaluationResultSchema = new Schema(
  {
    evaluationId: { type: String, required: true, unique: true, trim: true },
    timestamp: { type: Date, required: true, index: true },
    metrics: {
      floodIoU: { type: Number, required: true },
      precision: { type: Number, required: true },
      recall: { type: Number, required: true },
      leadTimeHours: { type: Number, required: true },
      falseAlarmRate: { type: Number, required: true },
      populationErrorPct: { type: Number, required: true },
      routeFeasibilityPct: { type: Number, required: true },
      resourceUtilizationPct: { type: Number, required: true },
      plannerFeasibilityPct: { type: Number, required: true }
    }
  },
  {
    collection: "evaluation_results",
    versionKey: false
  }
);

evaluationResultSchema.index({ timestamp: -1 });

export type EvaluationResult = InferSchemaType<typeof evaluationResultSchema>;

export const EvaluationResultModel: Model<EvaluationResult> =
  (mongoose.models.EvaluationResult as any) ?? model<EvaluationResult>("EvaluationResult", evaluationResultSchema);
