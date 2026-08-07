import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const affectedFacilitySchema = new Schema(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: "ImpactAssessment", required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    facilityId: { type: String, required: true, trim: true },
    facilityName: { type: String, required: true, trim: true },
    facilityType: {
      type: String,
      enum: ["hospital", "shelter", "school", "road"],
      required: true
    },
    geometry: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["flooded", "partially_blocked", "isolated", "operational_risk"],
      default: "flooded",
      required: true
    },
    properties: { type: Schema.Types.Mixed, default: {} }
  },
  {
    ...timestamps,
    collection: "affected_facilities"
  }
);

affectedFacilitySchema.index({ geometry: "2dsphere" });
affectedFacilitySchema.index({ assessmentId: 1, facilityType: 1 });

export type AffectedFacility = InferSchemaType<typeof affectedFacilitySchema>;

export const AffectedFacilityModel: Model<AffectedFacility> =
  models.AffectedFacility ?? model<AffectedFacility>("AffectedFacility", affectedFacilitySchema);
