import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const plannerActionOutcomeSchema = new Schema(
  {
    actionType: { type: String, required: true },
    description: { type: String, required: true }
  },
  { _id: false }
);

const calibrationPointSchema = new Schema(
  {
    bucket: { type: String, required: true },
    predictedConfidence: { type: Number, required: true },
    actualAccuracy: { type: Number, required: true }
  },
  { _id: false }
);

const learningReportSchema = new Schema(
  {
    reportId: { type: String, required: true, unique: true, trim: true },
    timestamp: { type: Date, required: true, index: true },
    predictedVsActualSummary: {
      predictedAreaKm2: { type: Number, required: true },
      actualAreaKm2: { type: Number, required: true },
      iou: { type: Number, required: true }
    },
    plannerSuccesses: [plannerActionOutcomeSchema],
    plannerFailures: [plannerActionOutcomeSchema],
    confidenceCalibration: [calibrationPointSchema],
    lessonsLearned: [{ type: String }],
    policyRecommendations: [{ type: String }]
  },
  {
    collection: "learning_reports",
    versionKey: false
  }
);

learningReportSchema.index({ timestamp: -1 });

export type LearningReport = InferSchemaType<typeof learningReportSchema>;

export const LearningReportModel: Model<LearningReport> =
  models.LearningReport ?? model<LearningReport>("LearningReport", learningReportSchema);
