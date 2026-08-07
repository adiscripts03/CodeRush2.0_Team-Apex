import type { ReplayTimeline } from "./replay.types";

export function getTimelineDurationMs(timeline: ReplayTimeline): number {
  return new Date(timeline.endsAt).getTime() - new Date(timeline.startsAt).getTime();
}

export function clampTimestamp(timeline: ReplayTimeline, timestampMs: number): number {
  const startsAt = new Date(timeline.startsAt).getTime();
  const endsAt = new Date(timeline.endsAt).getTime();
  return Math.min(Math.max(timestampMs, startsAt), endsAt);
}

export function timestampToSliderValue(timeline: ReplayTimeline, timestampMs: number): number {
  const duration = getTimelineDurationMs(timeline);
  if (duration <= 0) {
    return 100;
  }

  const startsAt = new Date(timeline.startsAt).getTime();
  return ((clampTimestamp(timeline, timestampMs) - startsAt) / duration) * 100;
}

export function sliderValueToTimestamp(timeline: ReplayTimeline, value: number): number {
  const startsAt = new Date(timeline.startsAt).getTime();
  const duration = getTimelineDurationMs(timeline);
  const boundedValue = Math.min(Math.max(value, 0), 100);
  return Math.round(startsAt + (duration * boundedValue) / 100);
}
