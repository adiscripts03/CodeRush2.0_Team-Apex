import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const disasterEventSchema = new Schema(
  {
    hazardType: {
      type: String,
      enum: ["flood", "wildfire", "landslide", "cyclone", "earthquake"],
      required: true
    },
    name: { type: String, required: true, trim: true },
    region: { type: Schema.Types.Mixed, required: true },
    timeRange: {
      startsAt: { type: Date, required: true },
      endsAt: { type: Date, required: true }
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      required: true
    },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    ...timestamps,
    collection: "disaster_events"
  }
);

disasterEventSchema.index({ region: "2dsphere" });
disasterEventSchema.index({ hazardType: 1, status: 1 });

export type DisasterEvent = InferSchemaType<typeof disasterEventSchema>;

export const DisasterEventModel: Model<DisasterEvent> =
  models.DisasterEvent ?? model<DisasterEvent>("DisasterEvent", disasterEventSchema);
