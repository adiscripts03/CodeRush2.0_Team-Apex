import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { timestamps } from "./model-options.js";

const humanApprovalSchema = new Schema(
  {
    decisionRecordId: { type: Schema.Types.ObjectId, ref: "DecisionRecord", required: true },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "expired"],
      default: "requested",
      required: true
    },
    requestedBy: { type: String, required: true, trim: true },
    approvedBy: { type: String, trim: true },
    rationale: { type: String, trim: true },
    constraints: { type: Schema.Types.Mixed, default: {} },
    decidedAt: { type: Date }
  },
  {
    ...timestamps,
    collection: "human_approvals"
  }
);

humanApprovalSchema.index({ decisionRecordId: 1 });
humanApprovalSchema.index({ status: 1, createdAt: -1 });

export type HumanApproval = InferSchemaType<typeof humanApprovalSchema>;

export const HumanApprovalModel: Model<HumanApproval> =
  models.HumanApproval ?? model<HumanApproval>("HumanApproval", humanApprovalSchema);
