import mongoose, { Schema, model, type Model, type InferSchemaType } from "mongoose";

const actorTypes = ["system", "human", "sensor", "planner", "simulation"] as const;
const severities = ["debug", "info", "warn", "error", "critical"] as const;
const hazardTypes = ["flood", "wildfire", "landslide", "cyclone", "earthquake"] as const;

const auditEventSchema = new Schema(
  {
    eventType: { type: String, required: true, trim: true },
    actorType: { type: String, enum: actorTypes, required: true },
    actorId: { type: String, trim: true },
    correlationId: { type: String, required: true, trim: true },
    hazardType: { type: String, enum: hazardTypes },
    severity: { type: String, enum: severities, default: "info", required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: () => new Date(), immutable: true }
  },
  {
    collection: "audit_events",
    versionKey: false
  }
);

auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ correlationId: 1, createdAt: 1 });
auditEventSchema.index({ hazardType: 1, createdAt: -1 });

export type AuditEvent = InferSchemaType<typeof auditEventSchema>;

export const AuditEventModel: Model<AuditEvent> =
  (mongoose.models.AuditEvent as any) ?? model<AuditEvent>("AuditEvent", auditEventSchema);

