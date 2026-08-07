import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { clearFailures, getActiveFailures, injectFailure, isFailureActive } from "../resilience/failure-simulator.engine.js";
import { FailureInjectionModel } from "../models/failure-injection.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "failure_sim_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FailureInjectionModel.deleteMany({});
});

describe("FailureSimulatorEngine", () => {
  it("injects active failure and sets parameters", async () => {
    const doc = await injectFailure({
      failureType: "comms_tower_outage",
      targetComponent: "telemetry_gateway",
      errorRate: 0.95
    });

    expect(doc.active).toBe(true);
    expect(doc.failureType).toBe("comms_tower_outage");

    const active = await isFailureActive("comms_tower_outage");
    expect(active).toBe(true);
  });

  it("clears active failure injections", async () => {
    await injectFailure({ failureType: "sensor_data_loss" });
    await injectFailure({ failureType: "network_latency", latencyMs: 2000 });

    const before = await getActiveFailures();
    expect(before).toHaveLength(2);

    const clearRes = await clearFailures();
    expect(clearRes.clearedCount).toBe(2);

    const after = await getActiveFailures();
    expect(after).toHaveLength(0);
  });
});
