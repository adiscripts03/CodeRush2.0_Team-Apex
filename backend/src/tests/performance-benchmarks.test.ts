import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "perf_benchmark_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const app = createApp();

describe("Performance Benchmarks Test", () => {
  it("responds to /health under 100ms", async () => {
    const start = Date.now();
    await supertest(app).get("/health").expect(200);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it("responds to /api/evaluation under 500ms", async () => {
    const start = Date.now();
    await supertest(app).get("/api/evaluation").expect(200);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it("responds to /api/routes/safe calculation under 500ms", async () => {
    const start = Date.now();
    await supertest(app)
      .get("/api/routes/safe?origLng=76.20&origLat=9.90&destLng=76.25&destLat=9.95")
      .expect(200);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
