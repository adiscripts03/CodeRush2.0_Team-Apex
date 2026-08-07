import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";

const failureInjectionSchema = new Schema(
  {
    injectionId: { type: String, required: true, unique: true, trim: true },
    failureType: {
      type: String,
      enum: [
        "comms_tower_outage",
        "sensor_data_loss",
        "road_network_failure",
        "shelter_overflow",
        "network_latency"
      ],
      required: true
    },
    targetComponent: { type: String, required: true, trim: true },
    parameters: {
      latencyMs: { type: Number, default: 0 },
      errorRate: { type: Number, default: 0 },
      affectedZones: [{ type: String }]
    },
    active: { type: Boolean, default: true, required: true },
    injectedAt: { type: Date, default: () => new Date(), required: true }
  },
  {
    collection: "failure_injections",
    versionKey: false
  }
);

failureInjectionSchema.index({ active: 1, failureType: 1 });

export type FailureInjection = InferSchemaType<typeof failureInjectionSchema>;

export const FailureInjectionModel: Model<FailureInjection> =
  (mongoose.models.FailureInjection as any) ?? model<FailureInjection>("FailureInjection", failureInjectionSchema);
