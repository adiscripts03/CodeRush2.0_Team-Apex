import { AppError } from "../errors/app-error.js";
import { MongoAuditService } from "../audit/audit.service.js";
import { PlanRecommendationModel } from "../models/plan-recommendation.model.js";
import { HumanApprovalModel } from "../models/human-approval.model.js";
import { ShelterCapacityModel } from "../models/shelter-capacity.model.js";
import { VehicleModel } from "../models/vehicle.model.js";
import { ResourceModel } from "../models/resource.model.js";

const auditService = new MongoAuditService();

export interface ApproveRecommendationInput {
  recommendationId: string;
  approvedBy?: string;
  rationale?: string;
}

export interface RejectRecommendationInput {
  recommendationId: string;
  rejectedBy?: string;
  rejectionReason: string;
}

export async function listApprovals(status?: string): Promise<{
  pending: unknown[];
  history: unknown[];
}> {
  const query = status ? { status } : {};
  const recommendations = await PlanRecommendationModel.find(query).sort({ timestamp: -1, priority: -1 }).lean();
  const approvals = await HumanApprovalModel.find().sort({ createdAt: -1 }).lean();

  const pending = recommendations.filter((r) => r.status === "proposed");
  const history = recommendations.filter((r) => r.status !== "proposed");

  return { pending, history, approvals } as any;
}

export async function approveRecommendation(input: ApproveRecommendationInput): Promise<unknown> {
  const rec = await PlanRecommendationModel.findOne({ recommendationId: input.recommendationId });

  if (!rec) {
    throw new AppError("Recommendation not found for requested ID", 404, "RECOMMENDATION_NOT_FOUND");
  }

  if (rec.status !== "proposed") {
    throw new AppError(`Recommendation already processed with status '${rec.status}'`, 400, "RECOMMENDATION_ALREADY_PROCESSED");
  }

  const approvedBy = input.approvedBy || "EOC Command Operator";
  const rationale = input.rationale || "Approved for immediate execution by EOC Command Operator";

  // Update PlanRecommendation state to approved
  rec.status = "approved";
  await rec.save();

  // Create HumanApproval record
  const approvalDoc = await HumanApprovalModel.create({
    decisionRecordId: rec._id,
    status: "approved",
    requestedBy: "Agentic Planner Engine",
    approvedBy,
    rationale,
    decidedAt: new Date()
  });

  // Record audit log event for approval granted
  await auditService.record({
    eventType: "approval.granted",
    actorType: "human",
    actorId: approvedBy,
    correlationId: `appr-granted:${rec.recommendationId}`,
    hazardType: "flood",
    payload: {
      recommendationId: rec.recommendationId,
      actionType: rec.actionType,
      targetName: rec.targetName,
      approvedBy,
      rationale
    }
  });

  // Execute simulation side-effects based on action type
  await executeRecommendationSideEffects(rec.actionType, rec.targetId, rec.targetName);

  // Update PlanRecommendation state to executed
  rec.status = "executed";
  await rec.save();

  // Record audit log event for execution completed
  await auditService.record({
    eventType: "recommendation.executed",
    actorType: "system",
    correlationId: `rec-exec:${rec.recommendationId}`,
    hazardType: "flood",
    payload: {
      recommendationId: rec.recommendationId,
      actionType: rec.actionType,
      targetName: rec.targetName,
      executedAt: new Date().toISOString()
    }
  });

  return {
    success: true,
    recommendation: rec.toObject(),
    approval: approvalDoc.toObject()
  };
}

export async function rejectRecommendation(input: RejectRecommendationInput): Promise<unknown> {
  if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
    throw new AppError("Rejection reason is mandatory when rejecting a recommendation", 400, "REJECTION_REASON_REQUIRED");
  }

  const rec = await PlanRecommendationModel.findOne({ recommendationId: input.recommendationId });

  if (!rec) {
    throw new AppError("Recommendation not found for requested ID", 404, "RECOMMENDATION_NOT_FOUND");
  }

  if (rec.status !== "proposed") {
    throw new AppError(`Recommendation already processed with status '${rec.status}'`, 400, "RECOMMENDATION_ALREADY_PROCESSED");
  }

  const rejectedBy = input.rejectedBy || "EOC Command Operator";
  const rejectionReason = input.rejectionReason.trim();

  // Update PlanRecommendation state to rejected
  rec.status = "rejected";
  await rec.save();

  // Create HumanApproval record
  const approvalDoc = await HumanApprovalModel.create({
    decisionRecordId: rec._id,
    status: "rejected",
    requestedBy: "Agentic Planner Engine",
    approvedBy: rejectedBy,
    rationale: rejectionReason,
    decidedAt: new Date()
  });

  // Record audit log event for rejection
  await auditService.record({
    eventType: "approval.rejected",
    actorType: "human",
    actorId: rejectedBy,
    correlationId: `appr-rejected:${rec.recommendationId}`,
    hazardType: "flood",
    payload: {
      recommendationId: rec.recommendationId,
      actionType: rec.actionType,
      targetName: rec.targetName,
      rejectedBy,
      rejectionReason
    }
  });

  return {
    success: true,
    recommendation: rec.toObject(),
    approval: approvalDoc.toObject()
  };
}

async function executeRecommendationSideEffects(
  actionType: string,
  targetId?: string | null,
  targetName?: string | null
): Promise<void> {
  if (actionType === "open_shelter" && targetId) {
    await ShelterCapacityModel.findOneAndUpdate(
      { shelterId: targetId },
      { $set: { status: "open" } }
    );
  } else if (actionType === "deploy_rescue_boats") {
    await ResourceModel.updateMany(
      { type: "rescue_boat" },
      { $set: { status: "deployed" } }
    );
    await VehicleModel.updateMany(
      { type: "rescue_boat" },
      { $set: { status: "deployed" } }
    );
  } else if (actionType === "send_medical_team") {
    await ResourceModel.updateMany(
      { type: "medical_team" },
      { $set: { status: "deployed" } }
    );
  }
}
