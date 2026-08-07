import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { FloodSnapshotModel } from "../models/flood-snapshot.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "replay_determinism_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await FloodSnapshotModel.deleteMany({});
});

describe("Replay Determinism Test", () => {
  it("produces identical deterministic outputs for identical target timestamp queries", async () => {
    const timestamp = new Date("2018-08-15T06:00:00.000Z");

    await FloodSnapshotModel.create({
      timestamp,
      sourceImageId: "SENTINEL_DETERMINISM_TEST",
      totalAreaKm2: 35.5,
      polygonCount: 3,
      confidenceScore: 0.88,
      status: "processed"
    });

    const run1 = await FloodSnapshotModel.findOne({ timestamp }).lean();
    const run2 = await FloodSnapshotModel.findOne({ timestamp }).lean();

    expect(run1).not.toBeNull();
    expect(run2).not.toBeNull();
    expect(run1?.totalAreaKm2).toBe(run2?.totalAreaKm2);
    expect(run1?.confidenceScore).toBe(run2?.confidenceScore);
    expect(run1?.polygonCount).toBe(run2?.polygonCount);
  });
});
