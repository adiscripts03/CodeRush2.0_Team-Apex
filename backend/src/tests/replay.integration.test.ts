import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "../app.js";
import { ReplayTimelineModel } from "../models/replay-timeline.model.js";
import { ReplaySnapshotModel } from "../models/replay-snapshot.model.js";
import { AuditEventModel } from "../models/audit-event.model.js";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "replay_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await ReplayTimelineModel.deleteMany({});
  await ReplaySnapshotModel.deleteMany({});
  await AuditEventModel.deleteMany({});
});

const app = createApp();

function seedTimeline() {
  return ReplayTimelineModel.create({
    hazardType: "flood",
    name: "Test Replay",
    description: "Integration test timeline",
    startsAt: new Date("2018-08-15T00:00:00.000Z"),
    endsAt: new Date("2018-08-15T12:00:00.000Z"),
    timestepMinutes: 360,
    source: {
      name: "Test fixture",
      provider: "Test",
      license: "Test",
      checksum: "abc123",
      importedAt: new Date()
    }
  });
}

async function seedSnapshots(timelineId: mongoose.Types.ObjectId) {
  return ReplaySnapshotModel.insertMany([
    {
      timelineId,
      sequence: 0,
      timestamp: new Date("2018-08-15T00:00:00.000Z"),
      state: {
        weather: { rainfallMm: 92, condition: "heavy_rain" },
        riverLevels: [{ station: "Periyar", levelMeters: 3.8, trend: "rising" }],
        notes: "Initial state"
      }
    },
    {
      timelineId,
      sequence: 1,
      timestamp: new Date("2018-08-15T06:00:00.000Z"),
      state: {
        weather: { rainfallMm: 141, condition: "extreme_rain" },
        riverLevels: [{ station: "Periyar", levelMeters: 4.6, trend: "rising" }],
        notes: "Flood expanding"
      }
    },
    {
      timelineId,
      sequence: 2,
      timestamp: new Date("2018-08-15T12:00:00.000Z"),
      state: {
        weather: { rainfallMm: 118, condition: "heavy_rain" },
        riverLevels: [{ station: "Periyar", levelMeters: 4.9, trend: "stable" }],
        notes: "Peak extent"
      }
    }
  ]);
}

describe("GET /api/replay/timelines", () => {
  it("returns empty array when no timelines exist", async () => {
    const response = await supertest(app).get("/api/replay/timelines").expect(200);
    expect(response.body.timelines).toEqual([]);
  });

  it("returns seeded timelines", async () => {
    await seedTimeline();

    const response = await supertest(app).get("/api/replay/timelines").expect(200);
    expect(response.body.timelines).toHaveLength(1);
    expect(response.body.timelines[0].name).toBe("Test Replay");
    expect(response.body.timelines[0].hazardType).toBe("flood");
  });
});

describe("GET /api/replay/timelines/:timelineId", () => {
  it("returns a single timeline by id", async () => {
    const timeline = await seedTimeline();

    const response = await supertest(app)
      .get(`/api/replay/timelines/${String(timeline._id)}`)
      .expect(200);

    expect(response.body.name).toBe("Test Replay");
    expect(response.body.timestepMinutes).toBe(360);
  });

  it("returns 404 for non-existent timeline", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await supertest(app)
      .get(`/api/replay/timelines/${String(fakeId)}`)
      .expect(404);

    expect(response.body.error.code).toBe("REPLAY_TIMELINE_NOT_FOUND");
  });

  it("returns 400 for invalid ObjectId format", async () => {
    const response = await supertest(app)
      .get("/api/replay/timelines/not-a-valid-id")
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/replay/timelines/:timelineId/snapshots", () => {
  it("returns all snapshots for a timeline", async () => {
    const timeline = await seedTimeline();
    await seedSnapshots(timeline._id);

    const response = await supertest(app)
      .get(`/api/replay/timelines/${String(timeline._id)}/snapshots`)
      .expect(200);

    expect(response.body.snapshots).toHaveLength(3);
    expect(response.body.snapshots[0].sequence).toBe(0);
    expect(response.body.snapshots[1].sequence).toBe(1);
    expect(response.body.snapshots[2].sequence).toBe(2);
  });

  it("returns empty array for timeline with no snapshots", async () => {
    const timeline = await seedTimeline();

    const response = await supertest(app)
      .get(`/api/replay/timelines/${String(timeline._id)}/snapshots`)
      .expect(200);

    expect(response.body.snapshots).toEqual([]);
  });

  it("returns closest snapshot when ?at= query is provided", async () => {
    const timeline = await seedTimeline();
    await seedSnapshots(timeline._id);

    const response = await supertest(app)
      .get(`/api/replay/timelines/${String(timeline._id)}/snapshots?at=2018-08-15T05:00:00.000Z`)
      .expect(200);

    // 5:00 is closer to 6:00 (1h) than 0:00 (5h), so should return sequence 1
    expect(response.body.sequence).toBe(1);
  });

  it("returns exact snapshot when ?at= matches a snapshot timestamp", async () => {
    const timeline = await seedTimeline();
    await seedSnapshots(timeline._id);

    const response = await supertest(app)
      .get(`/api/replay/timelines/${String(timeline._id)}/snapshots?at=2018-08-15T00:00:00.000Z`)
      .expect(200);

    expect(response.body.sequence).toBe(0);
    expect(response.body.state.weather.rainfallMm).toBe(92);
  });

  it("creates an audit event when loading a snapshot at a timestamp", async () => {
    const timeline = await seedTimeline();
    await seedSnapshots(timeline._id);

    await supertest(app)
      .get(`/api/replay/timelines/${String(timeline._id)}/snapshots?at=2018-08-15T06:00:00.000Z`)
      .expect(200);

    const auditEvents = await AuditEventModel.find({ eventType: "replay.snapshot.loaded" }).lean();
    expect(auditEvents.length).toBeGreaterThanOrEqual(1);
    expect(auditEvents[0].hazardType).toBe("flood");
  });
});

describe("POST /api/replay/events", () => {
  it("accepts a valid replay event and returns 202", async () => {
    const timeline = await seedTimeline();

    const response = await supertest(app)
      .post("/api/replay/events")
      .send({
        eventType: "replay.play.started",
        timelineId: String(timeline._id),
        timestamp: "2018-08-15T06:00:00.000Z"
      })
      .expect(202);

    expect(response.body.accepted).toBe(true);
  });

  it("creates an audit event for the replay event", async () => {
    const timeline = await seedTimeline();

    await supertest(app)
      .post("/api/replay/events")
      .send({
        eventType: "replay.play.paused",
        timelineId: String(timeline._id),
        timestamp: "2018-08-15T03:00:00.000Z"
      })
      .expect(202);

    const auditEvents = await AuditEventModel.find({ eventType: "replay.play.paused" }).lean();
    expect(auditEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects an invalid event type", async () => {
    const timeline = await seedTimeline();

    const response = await supertest(app)
      .post("/api/replay/events")
      .send({
        eventType: "not.a.valid.event",
        timelineId: String(timeline._id)
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a missing timelineId", async () => {
    const response = await supertest(app)
      .post("/api/replay/events")
      .send({
        eventType: "replay.play.started"
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an invalid timelineId format", async () => {
    const response = await supertest(app)
      .post("/api/replay/events")
      .send({
        eventType: "replay.play.started",
        timelineId: "bad-id"
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("accepts an event without optional fields", async () => {
    const timeline = await seedTimeline();

    const response = await supertest(app)
      .post("/api/replay/events")
      .send({
        eventType: "replay.speed.changed",
        timelineId: String(timeline._id)
      })
      .expect(202);

    expect(response.body.accepted).toBe(true);
  });

  it("accepts all valid replay event types", async () => {
    const timeline = await seedTimeline();
    const validTypes = [
      "replay.timeline.loaded",
      "replay.play.started",
      "replay.play.paused",
      "replay.timestamp.seeked",
      "replay.speed.changed",
      "replay.snapshot.loaded",
      "replay.controller.synced"
    ];

    for (const eventType of validTypes) {
      const response = await supertest(app)
        .post("/api/replay/events")
        .send({
          eventType,
          timelineId: String(timeline._id)
        })
        .expect(202);

      expect(response.body.accepted).toBe(true);
    }
  });
});
