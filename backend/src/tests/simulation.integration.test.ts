import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { FailureInjectionModel } from "../models/failure-injection.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "simulation_integration_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FailureInjectionModel.deleteMany({});
});

const app = createApp();

describe("POST /api/simulation/inject-failure & /simulation/inject-failure", () => {
  it("injects synthetic failure and returns active injection", async () => {
    const response = await supertest(app)
      .post("/api/simulation/inject-failure")
      .send({ failureType: "comms_tower_outage", targetComponent: "telemetry_gateway" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.injection.failureType).toBe("comms_tower_outage");
  });
});

describe("GET /api/simulation/active-failures & /simulation/active-failures", () => {
  it("returns active failure injections list", async () => {
    await FailureInjectionModel.create({
      injectionId: "FAIL_101",
      failureType: "sensor_data_loss",
      targetComponent: "ndwi_sensor",
      active: true
    });

    const response = await supertest(app).get("/api/simulation/active-failures").expect(200);
    expect(response.body.failures).toHaveLength(1);
    expect(response.body.count).toBe(1);
  });
});

describe("POST /api/simulation/clear-failures & /simulation/clear-failures", () => {
  it("clears all active failure injections", async () => {
    await FailureInjectionModel.create({
      injectionId: "FAIL_102",
      failureType: "sensor_data_loss",
      targetComponent: "ndwi_sensor",
      active: true
    });

    const response = await supertest(app).post("/api/simulation/clear-failures").send({}).expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.clearedCount).toBe(1);
  });
});

describe("GET /api/health/resilience & /health/resilience", () => {
  it("returns resilience health metrics", async () => {
    const response = await supertest(app).get("/api/health/resilience").expect(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.resilienceIndex).toBe(100);
    expect(response.body.offlineSyncEnabled).toBe(true);
  });
});
