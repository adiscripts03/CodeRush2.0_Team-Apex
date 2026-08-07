import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { approveRecommendation, rejectRecommendation } from "../approvals/approval.service.js";
import { PlanRecommendationModel } from "../models/plan-recommendation.model.js";
import { HumanApprovalModel } from "../models/human-approval.model.js";
import { ShelterCapacityModel } from "../models/shelter-capacity.model.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "approval_unit_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await PlanRecommendationModel.deleteMany({});
  await HumanApprovalModel.deleteMany({});
  await ShelterCapacityModel.deleteMany({});
  await AuditEventModel.deleteMany({});
});

async function seedTestRecommendation() {
  const rec = await PlanRecommendationModel.create({
    recommendationId: "REC_TEST_APPROVE_1",
    timestamp: new Date(),
    actionType: "open_shelter",
    targetName: "Test Relief Camp",
    targetId: "SHELTER_TEST_01",
    priority: "high",
    reasoning: ["Shelter capacity needed"],
    evidence: [{ metric: "Demand", value: 500, source: "Impact Engine" }],
    confidenceScore: 0.90,
    constraints: ["Supplies required"],
    alternatives: [{ action: "Transfer", tradeOff: "Distance" }],
    status: "proposed"
  });

  await ShelterCapacityModel.create({
    shelterId: "SHELTER_TEST_01",
    name: "Test Relief Camp",
    maxCapacity: 1000,
    currentOccupancy: 200,
    availableCapacity: 800,
    location: { type: "Point", coordinates: [76.28, 9.98] },
    status: "near_capacity"
  });

  return rec;
}

describe("approveRecommendation", () => {
  it("approves recommendation, executes side-effects, and creates audit events", async () => {
    const rec = await seedTestRecommendation();

    const result = await approveRecommendation({
      recommendationId: rec.recommendationId,
      approvedBy: "Commander Alex",
      rationale: "Urgent shelter opening required"
    }) as any;

    expect(result.success).toBe(true);
    expect(result.recommendation.status).toBe("executed");

    const approvalDoc = await HumanApprovalModel.findOne({ decisionRecordId: rec._id }).lean();
    expect(approvalDoc).not.toBeNull();
    expect(approvalDoc?.status).toBe("approved");
    expect(approvalDoc?.approvedBy).toBe("Commander Alex");

    const shelter = await ShelterCapacityModel.findOne({ shelterId: "SHELTER_TEST_01" }).lean();
    expect(shelter?.status).toBe("open"); // Side effect executed

    const auditEvents = await AuditEventModel.find({ correlationId: `appr-granted:${rec.recommendationId}` }).lean();
    expect(auditEvents).toHaveLength(1);
  });
});

describe("rejectRecommendation", () => {
  it("rejects recommendation and records mandatory rejection reason", async () => {
    const rec = await seedTestRecommendation();

    const result = await rejectRecommendation({
      recommendationId: rec.recommendationId,
      rejectedBy: "Commander Alex",
      rejectionReason: "Sufficient capacity exists in adjacent shelter"
    }) as any;

    expect(result.success).toBe(true);
    expect(result.recommendation.status).toBe("rejected");

    const approvalDoc = await HumanApprovalModel.findOne({ decisionRecordId: rec._id }).lean();
    expect(approvalDoc?.status).toBe("rejected");
    expect(approvalDoc?.rationale).toBe("Sufficient capacity exists in adjacent shelter");

    const auditEvents = await AuditEventModel.find({ correlationId: `appr-rejected:${rec.recommendationId}` }).lean();
    expect(auditEvents).toHaveLength(1);
  });

  it("fails if rejection reason is empty or whitespace", async () => {
    const rec = await seedTestRecommendation();

    await expect(
      rejectRecommendation({
        recommendationId: rec.recommendationId,
        rejectedBy: "Commander Alex",
        rejectionReason: "   "
      })
    ).rejects.toThrow("Rejection reason is mandatory");
  });
});
