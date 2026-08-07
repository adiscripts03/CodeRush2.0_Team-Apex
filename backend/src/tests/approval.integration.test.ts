import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { PlanRecommendationModel } from "../models/plan-recommendation.model.js";
import { HumanApprovalModel } from "../models/human-approval.model.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "approval_integration_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await PlanRecommendationModel.deleteMany({});
  await HumanApprovalModel.deleteMany({});
  await AuditEventModel.deleteMany({});
});

const app = createApp();

async function seedProposedRecommendation() {
  return PlanRecommendationModel.create({
    recommendationId: "REC_INT_101",
    timestamp: new Date(),
    actionType: "deploy_rescue_boats",
    targetName: "NDRF Motorised Boat Squad",
    targetId: "BOAT_NDRF_01",
    priority: "critical",
    reasoning: ["Flooded area requires boats"],
    evidence: [{ metric: "Flooded Area", value: "30 km²", source: "NDWI Engine" }],
    confidenceScore: 0.90,
    constraints: ["Fleet limit 12 boats"],
    alternatives: [{ action: "Air drop", tradeOff: "Cannot evacuate" }],
    status: "proposed"
  });
}

describe("GET /api/approvals & /approvals", () => {
  it("returns pending and history approvals lists", async () => {
    await seedProposedRecommendation();

    const response = await supertest(app).get("/api/approvals").expect(200);
    expect(response.body.pending).toHaveLength(1);
    expect(response.body.history).toHaveLength(0);
  });
});

describe("POST /api/approvals/approve & /approvals/:id/approve", () => {
  it("approves recommendation and executes side-effects", async () => {
    await seedProposedRecommendation();

    const response = await supertest(app)
      .post("/api/approvals/REC_INT_101/approve")
      .send({ approvedBy: "Commander Sarah", rationale: "Deployment essential" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.recommendation.status).toBe("executed");

    const auditEvents = await AuditEventModel.find({ eventType: "approval.granted" }).lean();
    expect(auditEvents).toHaveLength(1);
  });
});

describe("POST /api/approvals/reject & /approvals/:id/reject", () => {
  it("rejects recommendation when mandatory reason is provided", async () => {
    await seedProposedRecommendation();

    const response = await supertest(app)
      .post("/api/approvals/REC_INT_101/reject")
      .send({ rejectedBy: "Commander Sarah", rejectionReason: "Water level receding in sector 4" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.recommendation.status).toBe("rejected");
  });

  it("returns 400 when rejection reason is missing", async () => {
    await seedProposedRecommendation();

    await supertest(app)
      .post("/api/approvals/REC_INT_101/reject")
      .send({ rejectedBy: "Commander Sarah" })
      .expect(400);
  });
});

describe("GET /api/audit/timeline & /audit/timeline", () => {
  it("returns audit event timeline list", async () => {
    await AuditEventModel.create({
      timestamp: new Date(),
      eventType: "approval.granted",
      actorType: "human",
      correlationId: "c101",
      hazardType: "flood",
      payload: { note: "test" }
    });

    const response = await supertest(app).get("/api/audit/timeline").expect(200);
    expect(response.body.events).toHaveLength(1);
    expect(response.body.count).toBe(1);
  });
});
