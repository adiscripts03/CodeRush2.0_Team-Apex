import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const vehicleSchema = new Schema(
  {
    vehicleId: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ["rescue_boat", "ambulance", "truck", "helicopter"],
      required: true
    },
    name: { type: String, required: true, trim: true },
    passengerCapacity: { type: Number, required: true, min: 1 },
    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    },
    status: {
      type: String,
      enum: ["available", "deployed", "en_route", "maintenance"],
      default: "available",
      required: true
    }
  },
  {
    ...timestamps,
    collection: "vehicles"
  }
);

vehicleSchema.index({ currentLocation: "2dsphere" });
vehicleSchema.index({ type: 1, status: 1 });

export type Vehicle = InferSchemaType<typeof vehicleSchema>;

export const VehicleModel: Model<Vehicle> =
  (mongoose.models.Vehicle as any) ?? model<Vehicle>("Vehicle", vehicleSchema);
