import { describe, it, expect } from "vitest";
import {
  getTimelineDurationMs,
  clampTimestamp,
  timestampToSliderValue,
  sliderValueToTimestamp
} from "../replay/timestampController";
import type { ReplayTimeline } from "../replay/replay.types";

function makeTimeline(overrides: Partial<ReplayTimeline> = {}): ReplayTimeline {
  return {
    _id: "000000000000000000000001",
    name: "Test Timeline",
    startsAt: "2018-08-15T00:00:00.000Z",
    endsAt: "2018-08-15T12:00:00.000Z",
    timestepMinutes: 360,
    ...overrides
  };
}

const twelveHoursMs = 12 * 60 * 60 * 1000;
const startsAtMs = new Date("2018-08-15T00:00:00.000Z").getTime();
const endsAtMs = new Date("2018-08-15T12:00:00.000Z").getTime();

describe("getTimelineDurationMs", () => {
  it("returns the duration in milliseconds", () => {
    const timeline = makeTimeline();
    expect(getTimelineDurationMs(timeline)).toBe(twelveHoursMs);
  });

  it("returns 0 for a zero-duration timeline", () => {
    const timeline = makeTimeline({
      startsAt: "2018-08-15T06:00:00.000Z",
      endsAt: "2018-08-15T06:00:00.000Z"
    });
    expect(getTimelineDurationMs(timeline)).toBe(0);
  });
});

describe("clampTimestamp", () => {
  const timeline = makeTimeline();

  it("returns the start if timestamp is before the start", () => {
    const before = new Date("2018-08-14T00:00:00.000Z").getTime();
    expect(clampTimestamp(timeline, before)).toBe(startsAtMs);
  });

  it("returns the end if timestamp is after the end", () => {
    const after = new Date("2018-08-16T00:00:00.000Z").getTime();
    expect(clampTimestamp(timeline, after)).toBe(endsAtMs);
  });

  it("returns the timestamp if it is within the timeline", () => {
    const mid = new Date("2018-08-15T06:00:00.000Z").getTime();
    expect(clampTimestamp(timeline, mid)).toBe(mid);
  });

  it("returns the start when timestamp equals the start", () => {
    expect(clampTimestamp(timeline, startsAtMs)).toBe(startsAtMs);
  });

  it("returns the end when timestamp equals the end", () => {
    expect(clampTimestamp(timeline, endsAtMs)).toBe(endsAtMs);
  });
});

describe("timestampToSliderValue", () => {
  const timeline = makeTimeline();

  it("returns 0 at the start of the timeline", () => {
    expect(timestampToSliderValue(timeline, startsAtMs)).toBe(0);
  });

  it("returns 100 at the end of the timeline", () => {
    expect(timestampToSliderValue(timeline, endsAtMs)).toBe(100);
  });

  it("returns 50 at the midpoint", () => {
    const mid = startsAtMs + twelveHoursMs / 2;
    expect(timestampToSliderValue(timeline, mid)).toBe(50);
  });

  it("clamps timestamps before start to 0", () => {
    const before = new Date("2018-08-14T00:00:00.000Z").getTime();
    expect(timestampToSliderValue(timeline, before)).toBe(0);
  });

  it("clamps timestamps after end to 100", () => {
    const after = new Date("2018-08-16T00:00:00.000Z").getTime();
    expect(timestampToSliderValue(timeline, after)).toBe(100);
  });

  it("returns 100 for a zero-duration timeline", () => {
    const zeroDuration = makeTimeline({
      startsAt: "2018-08-15T06:00:00.000Z",
      endsAt: "2018-08-15T06:00:00.000Z"
    });
    const ts = new Date("2018-08-15T06:00:00.000Z").getTime();
    expect(timestampToSliderValue(zeroDuration, ts)).toBe(100);
  });
});

describe("sliderValueToTimestamp", () => {
  const timeline = makeTimeline();

  it("returns the start timestamp at slider value 0", () => {
    expect(sliderValueToTimestamp(timeline, 0)).toBe(startsAtMs);
  });

  it("returns the end timestamp at slider value 100", () => {
    expect(sliderValueToTimestamp(timeline, 100)).toBe(endsAtMs);
  });

  it("returns the midpoint at slider value 50", () => {
    const mid = startsAtMs + twelveHoursMs / 2;
    expect(sliderValueToTimestamp(timeline, 50)).toBe(mid);
  });

  it("clamps slider values below 0 to the start", () => {
    expect(sliderValueToTimestamp(timeline, -10)).toBe(startsAtMs);
  });

  it("clamps slider values above 100 to the end", () => {
    expect(sliderValueToTimestamp(timeline, 110)).toBe(endsAtMs);
  });

  it("rounds to the nearest millisecond", () => {
    const result = sliderValueToTimestamp(timeline, 33);
    expect(Number.isInteger(result)).toBe(true);
  });
});
