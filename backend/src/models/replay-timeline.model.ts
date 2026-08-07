import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const replayTimelineSchema = new Schema(
  {
    hazardType: {
      type: String,
      enum: ["flood", "wildfire", "landslide", "cyclone", "earthquake"],
      required: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    timestepMinutes: { type: Number, min: 1, required: true },
    source: {
      name: { type: String, required: true, trim: true },
      provider: { type: String, required: true, trim: true },
      license: { type: String, required: true, trim: true },
      checksum: { type: String, required: true, trim: true },
      importedAt: { type: Date, required: true }
    }
  },
  {
    ...timestamps,
    collection: "replay_timelines"
  }
);

replayTimelineSchema.index({ hazardType: 1, startsAt: 1 });

export type ReplayTimeline = InferSchemaType<typeof replayTimelineSchema>;

export const ReplayTimelineModel: Model<ReplayTimeline> =
  (mongoose.models.ReplayTimeline as any) ?? model<ReplayTimeline>("ReplayTimeline", replayTimelineSchema);
