import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const districtBreakdownSchema = new Schema(
  {
    district: { type: String, required: true },
    affectedPopulation: { type: Number, required: true, min: 0 },
    floodedAreaKm2: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const impactAssessmentSchema = new Schema(
  {
    timestamp: { type: Date, required: true, index: true },
    snapshotId: { type: Schema.Types.ObjectId, ref: "FloodSnapshot", required: true },
    affectedPopulationCount: { type: Number, required: true, min: 0 },
    blockedRoadCount: { type: Number, required: true, min: 0 },
    blockedRoadLengthKm: { type: Number, required: true, min: 0 },
    affectedHospitalCount: { type: Number, required: true, min: 0 },
    affectedShelterCount: { type: Number, required: true, min: 0 },
    affectedSchoolCount: { type: Number, required: true, min: 0 },
    totalCriticalFacilities: { type: Number, required: true, min: 0 },
    shelterDemandEstimate: { type: Number, required: true, min: 0 },
    severityScore: { type: Number, required: true, min: 0, max: 1 },
    severityLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true
    },
    districtBreakdown: { type: [districtBreakdownSchema], default: [] }
  },
  {
    ...timestamps,
    collection: "impact_assessments"
  }
);

impactAssessmentSchema.index({ timestamp: -1 });

export type ImpactAssessment = InferSchemaType<typeof impactAssessmentSchema>;

export const ImpactAssessmentModel: Model<ImpactAssessment> =
  models.ImpactAssessment ?? model<ImpactAssessment>("ImpactAssessment", impactAssessmentSchema);
