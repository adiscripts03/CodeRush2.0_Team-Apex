import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { computeEvaluationMetricsData, evaluateSystemPerformance } from "../evaluation/evaluation.engine.js";
import { EvaluationResultModel } from "../models/evaluation-result.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "eval_engine_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await EvaluationResultModel.deleteMany({});
});

describe("computeEvaluationMetricsData", () => {
  it("calculates IoU, precision, recall, and lead time metrics correctly", () => {
    const res = computeEvaluationMetricsData(32.5, 35.0);

    expect(res.floodIoU).toBeGreaterThan(0.70);
    expect(res.precision).toBeGreaterThan(0.75);
    expect(res.recall).toBeGreaterThan(0.75);
    expect(res.leadTimeHours).toBe(18.5);
    expect(res.falseAlarmRate).toBe(0.04);
    expect(res.populationErrorPct).toBe(3.2);
    expect(res.routeFeasibilityPct).toBe(100.0);
    expect(res.resourceUtilizationPct).toBe(88.0);
    expect(res.plannerFeasibilityPct).toBe(96.0);
  });
});

describe("evaluateSystemPerformance", () => {
  it("saves evaluation result to database and returns record", async () => {
    const result = await evaluateSystemPerformance();

    expect(result.evaluationId).toBeDefined();
    expect(result.metrics!.floodIoU).toBeGreaterThan(0.70);

    const doc = await EvaluationResultModel.findOne({ evaluationId: result.evaluationId }).lean();
    expect(doc).not.toBeNull();
  });
});
