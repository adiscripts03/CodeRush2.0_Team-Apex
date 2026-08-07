import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { generateLearningReport, getConfidenceCalibration } from "../evaluation/learning-report.generator.js";
import { LearningReportModel } from "../models/learning-report.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "learning_report_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await LearningReportModel.deleteMany({});
});

describe("generateLearningReport", () => {
  it("generates structured report with successes, failures, lessons learned, and policy recommendations", async () => {
    const report = await generateLearningReport();

    expect(report.reportId).toBeDefined();
    expect(report.plannerSuccesses.length).toBeGreaterThan(0);
    expect(report.plannerFailures.length).toBeGreaterThan(0);
    expect(report.confidenceCalibration.length).toBeGreaterThan(0);
    expect(report.lessonsLearned.length).toBeGreaterThan(0);
    expect(report.policyRecommendations.length).toBeGreaterThan(0);
  });
});

describe("getConfidenceCalibration", () => {
  it("returns confidence calibration curve data points", async () => {
    const points = await getConfidenceCalibration();
    expect(points.length).toBeGreaterThan(0);
    expect(points[0].bucket).toBeDefined();
    expect(points[0].predictedConfidence).toBeGreaterThan(0);
  });
});
