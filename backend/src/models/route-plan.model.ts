import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const pointLocationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const routePlanSchema = new Schema(
  {
    origin: { type: pointLocationSchema, required: true },
    destination: { type: pointLocationSchema, required: true },
    path: {
      type: { type: String, enum: ["LineString"], default: "LineString" },
      coordinates: { type: [[Number]], required: true }
    },
    totalDistanceKm: { type: Number, required: true, min: 0 },
    estimatedTimeMinutes: { type: Number, required: true, min: 0 },
    safetyStatus: {
      type: String,
      enum: ["safe", "blocked", "caution"],
      default: "safe",
      required: true
    },
    avoidedFloodAreaKm2: { type: Number, default: 0, min: 0 },
    assignedShelterId: { type: String, trim: true }
  },
  {
    ...timestamps,
    collection: "route_plans"
  }
);

routePlanSchema.index({ path: "2dsphere" });

export type RoutePlan = InferSchemaType<typeof routePlanSchema>;

export const RoutePlanModel: Model<RoutePlan> =
  (mongoose.models.RoutePlan as any) ?? model<RoutePlan>("RoutePlan", routePlanSchema);
