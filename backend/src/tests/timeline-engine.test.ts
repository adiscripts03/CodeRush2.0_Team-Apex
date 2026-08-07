import { describe, it, expect } from "vitest";
import {
  assertTimestampInTimeline,
  getTimestampProgress,
  findClosestSnapshot
} from "../replay/timeline-engine.js";
import type { ReplayTimeline } from "../models/replay-timeline.model.js";

function makeTimeline(overrides: Partial<ReplayTimeline> = {}): ReplayTimeline {
  return {
    hazardType: "flood",
    name: "Test Timeline",
    startsAt: new Date("2018-08-15T00:00:00.000Z"),
    endsAt: new Date("2018-08-15T12:00:00.000Z"),
    timestepMinutes: 360,
    source: {
      name: "Test",
      provider: "Test",
      license: "Test",
      checksum: "abc123",
      importedAt: new Date()
    },
    ...overrides
  } as ReplayTimeline;
}

interface MockSnapshot {
  timelineId: string;
  sequence: number;
  timestamp: Date;
  state: Record<string, unknown>;
}

function makeSnapshot(timestamp: string, sequence: number): MockSnapshot {
  return {
    timelineId: "000000000000000000000001",
    sequence,
    timestamp: new Date(timestamp),
    state: {
      weather: {},
      riverLevels: [],
      notes: `Snapshot ${sequence}`
    }
  };
}

describe("assertTimestampInTimeline", () => {
  const timeline = makeTimeline();

  it("accepts timestamp at timeline start", () => {
    expect(() => assertTimestampInTimeline(timeline, new Date("2018-08-15T00:00:00.000Z"))).not.toThrow();
  });

  it("accepts timestamp at timeline end", () => {
    expect(() => assertTimestampInTimeline(timeline, new Date("2018-08-15T12:00:00.000Z"))).not.toThrow();
  });

  it("accepts timestamp in the middle of the timeline", () => {
    expect(() => assertTimestampInTimeline(timeline, new Date("2018-08-15T06:00:00.000Z"))).not.toThrow();
  });

  it("throws for timestamp before timeline start", () => {
    expect(() => assertTimestampInTimeline(timeline, new Date("2018-08-14T23:59:59.000Z"))).toThrow(
      "Timestamp is outside the replay timeline"
    );
  });

  it("throws for timestamp after timeline end", () => {
    expect(() => assertTimestampInTimeline(timeline, new Date("2018-08-15T12:00:01.000Z"))).toThrow(
      "Timestamp is outside the replay timeline"
    );
  });
});

describe("getTimestampProgress", () => {
  const timeline = makeTimeline();

  it("returns 0 at timeline start", () => {
    const progress = getTimestampProgress(timeline, new Date("2018-08-15T00:00:00.000Z"));
    expect(progress).toBe(0);
  });

  it("returns 1 at timeline end", () => {
    const progress = getTimestampProgress(timeline, new Date("2018-08-15T12:00:00.000Z"));
    expect(progress).toBe(1);
  });

  it("returns 0.5 at midpoint", () => {
    const progress = getTimestampProgress(timeline, new Date("2018-08-15T06:00:00.000Z"));
    expect(progress).toBe(0.5);
  });

  it("returns 0.25 at quarter point", () => {
    const progress = getTimestampProgress(timeline, new Date("2018-08-15T03:00:00.000Z"));
    expect(progress).toBe(0.25);
  });

  it("returns 1 for a zero-duration timeline", () => {
    const zeroDuration = makeTimeline({
      startsAt: new Date("2018-08-15T06:00:00.000Z"),
      endsAt: new Date("2018-08-15T06:00:00.000Z")
    });
    const progress = getTimestampProgress(zeroDuration, new Date("2018-08-15T06:00:00.000Z"));
    expect(progress).toBe(1);
  });

  it("throws for timestamp outside timeline", () => {
    expect(() => getTimestampProgress(timeline, new Date("2018-08-16T00:00:00.000Z"))).toThrow();
  });
});

describe("findClosestSnapshot", () => {
  const snapshots: MockSnapshot[] = [
    makeSnapshot("2018-08-15T00:00:00.000Z", 0),
    makeSnapshot("2018-08-15T06:00:00.000Z", 1),
    makeSnapshot("2018-08-15T12:00:00.000Z", 2)
  ];

  it("returns null for empty snapshot array", () => {
    const result = findClosestSnapshot([], new Date("2018-08-15T06:00:00.000Z"));
    expect(result).toBeNull();
  });

  it("returns exact match when timestamp matches a snapshot", () => {
    const result = findClosestSnapshot(snapshots, new Date("2018-08-15T06:00:00.000Z"));
    expect(result).not.toBeNull();
    expect(result!.sequence).toBe(1);
  });

  it("returns the closest earlier snapshot when between snapshots", () => {
    const result = findClosestSnapshot(snapshots, new Date("2018-08-15T02:00:00.000Z"));
    expect(result).not.toBeNull();
    // 2:00 is 2 hours from 0:00 and 4 hours from 6:00, so closest is snapshot 0
    expect(result!.sequence).toBe(0);
  });

  it("returns the closest later snapshot when nearer", () => {
    const result = findClosestSnapshot(snapshots, new Date("2018-08-15T05:00:00.000Z"));
    expect(result).not.toBeNull();
    // 5:00 is 5 hours from 0:00 and 1 hour from 6:00, so closest is snapshot 1
    expect(result!.sequence).toBe(1);
  });

  it("returns first snapshot for exact first timestamp", () => {
    const result = findClosestSnapshot(snapshots, new Date("2018-08-15T00:00:00.000Z"));
    expect(result).not.toBeNull();
    expect(result!.sequence).toBe(0);
  });

  it("returns last snapshot for exact last timestamp", () => {
    const result = findClosestSnapshot(snapshots, new Date("2018-08-15T12:00:00.000Z"));
    expect(result).not.toBeNull();
    expect(result!.sequence).toBe(2);
  });

  it("returns the only snapshot in a single-element array", () => {
    const single = [makeSnapshot("2018-08-15T06:00:00.000Z", 0)];
    const result = findClosestSnapshot(single, new Date("2018-08-15T10:00:00.000Z"));
    expect(result).not.toBeNull();
    expect(result!.sequence).toBe(0);
  });
});
