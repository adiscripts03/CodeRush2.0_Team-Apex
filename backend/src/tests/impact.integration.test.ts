import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { FloodPolygonModel } from "../models/flood-polygon.model.js";
import { ImpactAssessmentModel } from "../models/impact-assessment.model.js";
import { AffectedFacilityModel } from "../models/affected-facility.model.js";
import { AffectedPopulationModel } from "../models/affected-population.model.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "impact_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FloodSnapshotModel.deleteMany({});
  await FloodPolygonModel.deleteMany({});
  await ImpactAssessmentModel.deleteMany({});
  await AffectedFacilityModel.deleteMany({});
  await AffectedPopulationModel.deleteMany({});
  await AuditEventModel.deleteMany({});
});

const app = createApp();

async function seedFloodSnapshot() {
  const timestamp = new Date("2018-08-15T06:00:00.000Z");
  const snapshot = await FloodSnapshotModel.create({
    timestamp,
    sourceImageId: "TEST_SENTINEL",
    totalAreaKm2: 35.0,
    polygonCount: 1,
    confidenceScore: 0.85,
    status: "processed"
  });

  await FloodPolygonModel.create({
    snapshotId: snapshot._id,
    timestamp,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [76.2, 9.9],
          [76.4, 9.9],
          [76.4, 10.1],
          [76.2, 10.1],
          [76.2, 9.9]
        ]
      ]
    },
    properties: { areaKm2: 35.0, confidence: 0.85, meanNdwi: 0.5, sensorType: "Sentinel-2" },
    checksum: "hash123"
  });

  return snapshot;
}

describe("GET /api/impact/:timestamp & /impact/:timestamp", () => {
  it("calculates and returns impact assessment for a timestamp", async () => {
    await seedFloodSnapshot();

    const response = await supertest(app)
      .get("/api/impact/2018-08-15T06:00:00.000Z")
      .expect(200);

    expect(response.body.affectedPopulationCount).toBeGreaterThan(0);
    expect(response.body.severityScore).toBeGreaterThan(0);
    expect(["low", "medium", "high", "critical"]).toContain(response.body.severityLevel);

    const auditEvents = await AuditEventModel.find({ eventType: "impact.assessment.completed" }).lean();
    expect(auditEvents).toHaveLength(1);
  });

  it("works with spec alias /impact/:timestamp", async () => {
    await seedFloodSnapshot();

    await supertest(app)
      .get("/impact/2018-08-15T06:00:00.000Z")
      .expect(200);
  });

  it("returns 404 for non-existent snapshot timestamp", async () => {
    await supertest(app)
      .get("/api/impact/2018-08-15T23:59:59.000Z")
      .expect(404);
  });
});

describe("GET /api/impact/summary", () => {
  it("returns latest impact summary", async () => {
    await seedFloodSnapshot();

    const response = await supertest(app).get("/api/impact/summary").expect(200);
    expect(response.body.affectedPopulationCount).toBeGreaterThan(0);
    expect(response.body.shelterDemandEstimate).toBeGreaterThan(0);
  });
});

describe("GET /api/impact/population", () => {
  it("returns affected population breakdown", async () => {
    await seedFloodSnapshot();
    await supertest(app).get("/api/impact/2018-08-15T06:00:00.000Z").expect(200);

    const response = await supertest(app).get("/api/impact/population").expect(200);
    expect(response.body.population).toBeDefined();
    expect(Array.isArray(response.body.population)).toBe(true);
  });
});

describe("GET /api/impact/infrastructure", () => {
  it("returns affected infrastructure and facilities", async () => {
    await seedFloodSnapshot();
    await supertest(app).get("/api/impact/2018-08-15T06:00:00.000Z").expect(200);

    const response = await supertest(app).get("/api/impact/infrastructure").expect(200);
    expect(response.body.infrastructure).toBeDefined();
    expect(Array.isArray(response.body.infrastructure)).toBe(true);
  });
});
