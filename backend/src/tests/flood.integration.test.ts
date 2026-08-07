import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { FloodPolygonModel } from "../models/flood-polygon.model.js";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";
import { DetectionResultModel } from "../models/detection-result.model.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "flood_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FloodPolygonModel.deleteMany({});
  await FloodSnapshotModel.deleteMany({});
  await DetectionResultModel.deleteMany({});
  await AuditEventModel.deleteMany({});
});

const app = createApp();

const samplePayload = {
  timestamp: "2018-08-15T06:00:00.000Z",
  sourceImageId: "SENTINEL2_20180815_TEST",
  threshold: 0.3,
  cloudCoverFraction: 0.05,
  cells: [
    { lng: 76.25, lat: 9.95, green: 0.5, nir: 0.1 },
    { lng: 76.30, lat: 10.0, green: 0.52, nir: 0.11 }
  ]
};

describe("POST /api/flood/detect & /flood/detect", () => {
  it("runs NDWI detection, stores snapshot and polygons, emits audit log", async () => {
    const response = await supertest(app)
      .post("/api/flood/detect")
      .send(samplePayload)
      .expect(201);

    expect(response.body.algorithm).toBe("NDWI_SENTINEL_2");
    expect(response.body.confidenceScore).toBeGreaterThan(0.5);

    const snapshots = await FloodSnapshotModel.find().lean();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].polygonCount).toBe(2);

    const polygons = await FloodPolygonModel.find().lean();
    expect(polygons.length).toBeGreaterThanOrEqual(2);

    const auditEvents = await AuditEventModel.find({ eventType: "flood.detection.completed" }).lean();
    expect(auditEvents).toHaveLength(1);
  });

  it("works with spec alias POST /flood/detect", async () => {
    await supertest(app)
      .post("/flood/detect")
      .send(samplePayload)
      .expect(201);
  });

  it("returns 400 for invalid cell payload", async () => {
    await supertest(app)
      .post("/api/flood/detect")
      .send({
        timestamp: "2018-08-15T06:00:00.000Z",
        sourceImageId: "TEST",
        cells: []
      })
      .expect(400);
  });
});

describe("GET /api/flood/current & /flood/current", () => {
  it("returns empty feature collection when no snapshot exists", async () => {
    const response = await supertest(app).get("/api/flood/current").expect(200);
    expect(response.body.snapshot).toBeNull();
    expect(response.body.features.features).toEqual([]);
  });

  it("returns the latest detected flood polygons", async () => {
    await supertest(app).post("/api/flood/detect").send(samplePayload).expect(201);

    const response = await supertest(app).get("/api/flood/current").expect(200);
    expect(response.body.snapshot).not.toBeNull();
    expect(response.body.features.features.length).toBeGreaterThan(0);
  });
});

describe("GET /api/flood/history", () => {
  it("returns snapshot history", async () => {
    await supertest(app).post("/api/flood/detect").send(samplePayload).expect(201);

    const response = await supertest(app).get("/api/flood/history").expect(200);
    expect(response.body.history).toHaveLength(1);
  });
});

describe("GET /api/flood/change/:timestamp", () => {
  it("returns spatial change analysis comparing to prior snapshot", async () => {
    // Snapshot 1 (t1)
    await supertest(app)
      .post("/api/flood/detect")
      .send({
        timestamp: "2018-08-15T00:00:00.000Z",
        sourceImageId: "IMG_1",
        cells: [{ lng: 76.25, lat: 9.95, green: 0.5, nir: 0.1 }]
      })
      .expect(201);

    // Snapshot 2 (t2)
    await supertest(app)
      .post("/api/flood/detect")
      .send({
        timestamp: "2018-08-15T06:00:00.000Z",
        sourceImageId: "IMG_2",
        cells: [
          { lng: 76.25, lat: 9.95, green: 0.5, nir: 0.1 },
          { lng: 76.30, lat: 10.0, green: 0.52, nir: 0.11 }
        ]
      })
      .expect(201);

    const response = await supertest(app)
      .get("/api/flood/change/2018-08-15T06:00:00.000Z")
      .expect(200);

    expect(response.body.areaToKm2).toBeGreaterThan(response.body.areaFromKm2);
    expect(response.body.netChangeKm2).toBeGreaterThan(0);
    expect(response.body.expandedFeatures.features.length).toBeGreaterThan(0);
  });

  it("returns 404 for missing target snapshot timestamp", async () => {
    await supertest(app)
      .get("/api/flood/change/2018-08-15T23:59:59.000Z")
      .expect(404);
  });
});
