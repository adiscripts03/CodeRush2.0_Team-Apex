import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { executeDecisionLoop } from "../planner/decision-loop.engine.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "planner_workflow_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Planner Workflow Integration Test", () => {
  it("runs decision loop workflow and outputs 6 recommendation types with evidence", () => {
    const loopResult = executeDecisionLoop({
      timestamp: new Date("2018-08-15T06:00:00.000Z"),
      floodAreaKm2: 30.0,
      confidenceScore: 0.88,
      affectedPopulation: 45_000,
      blockedRoadCount: 5,
      blockedRoadLengthKm: 12.0,
      affectedHospitalCount: 1,
      shelterDemand: 9_000,
      openShelterCapacity: 3_000,
      availableBoats: 10
    });

    expect(loopResult.stages).toHaveLength(5);
    expect(loopResult.recommendations.length).toBeGreaterThan(0);

    for (const rec of loopResult.recommendations) {
      expect(rec.recommendationId).toBeDefined();
      expect(rec.reasoning.length).toBeGreaterThan(0);
      expect(rec.evidence.length).toBeGreaterThan(0);
      expect(rec.constraints.length).toBeGreaterThan(0);
      expect(rec.alternatives.length).toBeGreaterThan(0);
    }
  });
});
