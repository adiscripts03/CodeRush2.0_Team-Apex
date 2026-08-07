import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getAuditTimeline } from "../audit/audit-timeline.service.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "audit_timeline_unit_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await AuditEventModel.deleteMany({});
});

describe("getAuditTimeline", () => {
  it("returns chronologically sorted audit log events", async () => {
    await AuditEventModel.create({
      timestamp: new Date("2018-08-15T06:00:00.000Z"),
      eventType: "planner.run.completed",
      actorType: "system",
      correlationId: "c1",
      hazardType: "flood",
      payload: { note: "test" }
    });

    await AuditEventModel.create({
      timestamp: new Date("2018-08-15T06:05:00.000Z"),
      eventType: "approval.granted",
      actorType: "human",
      correlationId: "c2",
      hazardType: "flood",
      payload: { note: "granted" }
    });

    const result = await getAuditTimeline({ limit: 10 });
    expect(result.events).toHaveLength(2);
    expect((result.events[0] as any).correlationId).toBe("c2"); // Most recent first
  });
});
