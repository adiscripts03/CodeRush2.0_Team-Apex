import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const shelterCapacitySchema = new Schema(
  {
    shelterId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    currentOccupancy: { type: Number, required: true, min: 0 },
    availableCapacity: { type: Number, required: true, min: 0 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    },
    status: {
      type: String,
      enum: ["open", "near_capacity", "full", "flooded"],
      default: "open",
      required: true
    },
    supplies: {
      foodRationsKg: { type: Number, default: 1000, min: 0 },
      medicalKits: { type: Number, default: 50, min: 0 },
      drinkingWaterLiters: { type: Number, default: 2000, min: 0 }
    }
  },
  {
    ...timestamps,
    collection: "shelter_capacities"
  }
);

shelterCapacitySchema.index({ location: "2dsphere" });
shelterCapacitySchema.index({ status: 1, availableCapacity: -1 });

export type ShelterCapacity = InferSchemaType<typeof shelterCapacitySchema>;

export const ShelterCapacityModel: Model<ShelterCapacity> =
  (mongoose.models.ShelterCapacity as any) ?? model<ShelterCapacity>("ShelterCapacity", shelterCapacitySchema);
