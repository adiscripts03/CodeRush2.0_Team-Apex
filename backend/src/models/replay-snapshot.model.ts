import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const replaySnapshotSchema = new Schema(
  {
    timelineId: { type: Schema.Types.ObjectId, ref: "ReplayTimeline", required: true },
    sequence: { type: Number, min: 0, required: true },
    timestamp: { type: Date, required: true },
    state: {
      floodExtent: { type: Schema.Types.Mixed },
      weather: { type: Schema.Types.Mixed, default: {} },
      riverLevels: { type: [Schema.Types.Mixed], default: [] },
      roadAvailability: { type: Schema.Types.Mixed },
      notes: { type: String, trim: true }
    }
  },
  {
    ...timestamps,
    collection: "replay_snapshots"
  }
);

replaySnapshotSchema.index({ timelineId: 1, timestamp: 1 }, { unique: true });
replaySnapshotSchema.index({ timelineId: 1, sequence: 1 }, { unique: true });

export type ReplaySnapshot = InferSchemaType<typeof replaySnapshotSchema>;

export const ReplaySnapshotModel: Model<ReplaySnapshot> =
  models.ReplaySnapshot ?? model<ReplaySnapshot>("ReplaySnapshot", replaySnapshotSchema);
