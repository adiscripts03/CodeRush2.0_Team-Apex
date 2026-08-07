import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { FloodPolygonModel } from "../models/flood-polygon.model.js";
import { ImpactAssessmentModel } from "../models/impact-assessment.model.js";
import { PlanRecommendationModel } from "../models/plan-recommendation.model.js";
import { ShelterCapacityModel } from "../models/shelter-capacity.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "e2e_cycle_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FloodSnapshotModel.deleteMany({});
  await FloodPolygonModel.deleteMany({});
  await ImpactAssessmentModel.deleteMany({});
  await PlanRecommendationModel.deleteMany({});
  await ShelterCapacityModel.deleteMany({});
});

const app = createApp();

describe("Full 8-Stage Decision Cycle E2E Integration Test", () => {
  it("executes complete lifecycle: Observe -> Estimate -> Explain -> Plan -> Approve -> Execute -> Evaluate -> Report", async () => {
    // Seed snapshot for impact estimation
    const snapshot = await FloodSnapshotModel.create({
      timestamp: new Date("2018-08-15T06:00:00.000Z"),
      sourceImageId: "SENTINEL_2_KERALA_20180815",
      totalAreaKm2: 35.0,
      polygonCount: 2,
      confidenceScore: 0.92,
      status: "processed"
    });

    await FloodPolygonModel.create({
      snapshotId: snapshot._id,
      timestamp: snapshot.timestamp,
      geometry: {
        type: "Polygon",
        coordinates: [[[76.20, 9.90], [76.30, 9.90], [76.30, 10.00], [76.20, 10.00], [76.20, 9.90]]]
      },
      properties: {
        areaKm2: 35.0,
        confidence: 0.92,
        meanNdwi: 0.35,
        sensorType: "Sentinel-2"
      },
      checksum: "chk_e2e_101"
    });

    // 1. Observe & Replay
    const currentFloodRes = await supertest(app).get("/api/flood/current").expect(200);
    expect(currentFloodRes.body.snapshot).toBeDefined();

    // 2. Estimate Impact
    const impactRes = await supertest(app).get("/api/impact/summary").expect(200);
    expect(impactRes.body.affectedPopulationCount).toBeGreaterThan(0);

    // 3 & 4. Run Agentic Planner (Observe -> Estimate -> Explain -> Plan -> Review)
    const planRes = await supertest(app).post("/api/planner/run").send({}).expect(200);
    expect(planRes.body.stages).toHaveLength(5);
    expect(planRes.body.recommendations.length).toBeGreaterThan(0);

    const firstRec = planRes.body.recommendations[0];

    // 5 & 6. Human Command Approval & Execution
    const approveRes = await supertest(app)
      .post(`/api/approvals/${firstRec.recommendationId}/approve`)
      .send({ approvedBy: "EOC Chief Commander", rationale: "Validated against GIS layer" })
      .expect(200);

    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.recommendation.status).toBe("executed");

    // 7. Evaluate Performance
    const evalRes = await supertest(app).get("/api/evaluation").expect(200);
    expect(evalRes.body.metrics.floodIoU).toBeGreaterThan(0.70);

    // 8. Generate Learning Report
    const reportRes = await supertest(app).get("/api/evaluation/report").expect(200);
    expect(reportRes.body.lessonsLearned.length).toBeGreaterThan(0);
  });
});
