import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "api_regression_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const app = createApp();

describe("API Regression Test Suite Across All Milestones", () => {
  it("GET /health — returns 200 OK", async () => {
    await supertest(app).get("/health").expect(200);
  });

  it("GET /api/gis/layers — returns 200 OK", async () => {
    await supertest(app).get("/api/gis/layers").expect(200);
  });

  it("GET /api/replay/timelines — returns 200 OK", async () => {
    await supertest(app).get("/api/replay/timelines").expect(200);
  });

  it("GET /api/flood/current — returns 200 OK", async () => {
    await supertest(app).get("/api/flood/current").expect(200);
  });

  it("GET /api/impact/summary — returns 200 OK", async () => {
    await supertest(app).get("/api/impact/summary").expect(200);
  });

  it("GET /api/resources — returns 200 OK", async () => {
    await supertest(app).get("/api/resources").expect(200);
  });

  it("GET /api/routes/safe — returns 200 OK", async () => {
    await supertest(app)
      .get("/api/routes/safe?origLng=76.20&origLat=9.90&destLng=76.25&destLat=9.95")
      .expect(200);
  });

  it("POST /api/planner/run — returns 200 OK", async () => {
    await supertest(app).post("/api/planner/run").send({}).expect(200);
  });

  it("GET /api/approvals — returns 200 OK", async () => {
    await supertest(app).get("/api/approvals").expect(200);
  });

  it("GET /api/simulation/active-failures — returns 200 OK", async () => {
    await supertest(app).get("/api/simulation/active-failures").expect(200);
  });

  it("GET /api/health/resilience — returns 200 OK", async () => {
    await supertest(app).get("/api/health/resilience").expect(200);
  });

  it("GET /api/evaluation — returns 200 OK", async () => {
    await supertest(app).get("/api/evaluation").expect(200);
  });
});
