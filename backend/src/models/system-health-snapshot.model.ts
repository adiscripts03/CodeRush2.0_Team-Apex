import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";

const dependencySchema = new Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["ok", "degraded", "unavailable"], required: true },
    detail: { type: String }
  },
  { _id: false }
);

const systemHealthSnapshotSchema = new Schema(
  {
    service: { type: String, required: true, trim: true },
    status: { type: String, enum: ["ok", "degraded", "unavailable"], required: true },
    dependencies: { type: [dependencySchema], default: [] },
    observedAt: { type: Date, default: () => new Date(), required: true }
  },
  {
    collection: "system_health_snapshots",
    versionKey: false
  }
);

systemHealthSnapshotSchema.index({ observedAt: -1 });
systemHealthSnapshotSchema.index({ service: 1, observedAt: -1 });

export type SystemHealthSnapshot = InferSchemaType<typeof systemHealthSnapshotSchema>;

export const SystemHealthSnapshotModel: Model<SystemHealthSnapshot> =
  (mongoose.models.SystemHealthSnapshot as any) ??
  model<SystemHealthSnapshot>("SystemHealthSnapshot", systemHealthSnapshotSchema);
