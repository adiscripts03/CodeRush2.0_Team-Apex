import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { ImpactAssessmentModel } from "../models/impact-assessment.model.js";
import { PlanRecommendationModel } from "../models/plan-recommendation.model.js";
import { PlannerExplanationModel } from "../models/planner-explanation.model.js";
import { DecisionRecordModel } from "../models/decision-record.model.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "planner_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FloodSnapshotModel.deleteMany({});
  await ImpactAssessmentModel.deleteMany({});
  await PlanRecommendationModel.deleteMany({});
  await PlannerExplanationModel.deleteMany({});
  await DecisionRecordModel.deleteMany({});
  await AuditEventModel.deleteMany({});
});

const app = createApp();

async function seedData() {
  const timestamp = new Date("2018-08-15T06:00:00.000Z");

  const snapshot = await FloodSnapshotModel.create({
    timestamp,
    sourceImageId: "SENTINEL_PLANNER_TEST",
    totalAreaKm2: 40.0,
    polygonCount: 2,
    confidenceScore: 0.88,
    status: "processed"
  });

  await ImpactAssessmentModel.create({
    timestamp,
    snapshotId: snapshot._id,
    affectedPopulationCount: 50_000,
    blockedRoadCount: 8,
    blockedRoadLengthKm: 20.0,
    affectedHospitalCount: 2,
    affectedShelterCount: 1,
    affectedSchoolCount: 3,
    totalCriticalFacilities: 6,
    shelterDemandEstimate: 10_000,
    severityScore: 0.75,
    severityLevel: "high"
  });

  return snapshot;
}

describe("POST /api/planner/run & /planner/run", () => {
  it("runs decision loop, stores recommendations & decision records, emits audit log", async () => {
    await seedData();

    const response = await supertest(app)
      .post("/api/planner/run")
      .send({ timestamp: "2018-08-15T06:00:00.000Z" })
      .expect(200);

    expect(response.body.stages).toHaveLength(5);
    expect(response.body.recommendations.length).toBeGreaterThan(0);

    const recsInDb = await PlanRecommendationModel.find().lean();
    expect(recsInDb.length).toBeGreaterThan(0);

    const decisionRecords = await DecisionRecordModel.find({ loopStage: "plan" }).lean();
    expect(decisionRecords).toHaveLength(1);

    const auditEvents = await AuditEventModel.find({ eventType: "planner.run.completed" }).lean();
    expect(auditEvents).toHaveLength(1);
  });

  it("works with spec alias POST /planner/run", async () => {
    await seedData();
    await supertest(app).post("/planner/run").send({}).expect(200);
  });
});

describe("GET /api/planner/recommendations & /planner/recommendations", () => {
  it("returns active recommendations", async () => {
    await seedData();
    await supertest(app).post("/api/planner/run").send({}).expect(200);

    const response = await supertest(app).get("/api/planner/recommendations").expect(200);
    expect(response.body.recommendations).toBeDefined();
    expect(response.body.recommendations.length).toBeGreaterThan(0);
  });
});

describe("GET /api/planner/explanation/:id & /planner/explanation/:id", () => {
  it("returns detailed explanation trace for a recommendation", async () => {
    await seedData();
    const runRes = await supertest(app).post("/api/planner/run").send({}).expect(200);
    const firstRecId = runRes.body.recommendations[0].recommendationId;

    const response = await supertest(app)
      .get(`/api/planner/explanation/${firstRecId}`)
      .expect(200);

    expect(response.body.recommendation.recommendationId).toBe(firstRecId);
    expect(response.body.explanation).toBeDefined();
  });

  it("returns 404 for non-existent recommendation ID", async () => {
    await supertest(app)
      .get("/api/planner/explanation/REC_INVALID_99999")
      .expect(404);
  });
});
