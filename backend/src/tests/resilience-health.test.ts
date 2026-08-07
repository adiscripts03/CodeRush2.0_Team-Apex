import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getResilienceHealthMetrics } from "../resilience/resilience-health.service.js";
import { injectFailure, clearFailures } from "../resilience/failure-simulator.engine.js";
import { FailureInjectionModel } from "../models/failure-injection.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "resilience_health_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FailureInjectionModel.deleteMany({});
});

describe("getResilienceHealthMetrics", () => {
  it("returns healthy status when no failures are injected", async () => {
    const health = await getResilienceHealthMetrics();
    expect(health.status).toBe("healthy");
    expect(health.activeFailureCount).toBe(0);
    expect(health.resilienceIndex).toBe(100);
  });

  it("returns degraded status when failures are active", async () => {
    await injectFailure({ failureType: "comms_tower_outage" });

    const health = await getResilienceHealthMetrics();
    expect(health.status).toBe("degraded");
    expect(health.activeFailureCount).toBe(1);
    expect(health.resilienceIndex).toBe(80);
    expect(health.degradedMode).toBe(true);
  });
});
