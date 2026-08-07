import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const resourceSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["rescue_boat", "ambulance", "medical_team", "volunteer", "food_stock"],
      required: true
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    },
    status: {
      type: String,
      enum: ["available", "deployed", "maintenance"],
      default: "available",
      required: true
    },
    assignedZone: { type: String, trim: true }
  },
  {
    ...timestamps,
    collection: "resources"
  }
);

resourceSchema.index({ location: "2dsphere" });
resourceSchema.index({ type: 1, status: 1 });

export type Resource = InferSchemaType<typeof resourceSchema>;

export const ResourceModel: Model<Resource> =
  (mongoose.models.Resource as any) ?? model<Resource>("Resource", resourceSchema);
