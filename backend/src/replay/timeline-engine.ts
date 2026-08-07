import type { ReplayTimeline } from "../models/replay-timeline.model.js";

export interface TimelineCursor {
  timestamp: Date;
  sequence: number;
}

export function assertTimestampInTimeline(timeline: ReplayTimeline, timestamp: Date): void {
  if (timestamp < timeline.startsAt || timestamp > timeline.endsAt) {
    throw new Error("Timestamp is outside the replay timeline");
  }
}

export function getTimestampProgress(timeline: ReplayTimeline, timestamp: Date): number {
  assertTimestampInTimeline(timeline, timestamp);

  const duration = timeline.endsAt.getTime() - timeline.startsAt.getTime();
  if (duration === 0) {
    return 1;
  }

  return (timestamp.getTime() - timeline.startsAt.getTime()) / duration;
}

export function findClosestSnapshot<T extends { timestamp: Date }>(snapshots: T[], timestamp: Date): T | null {
  if (snapshots.length === 0) {
    return null;
  }

  return snapshots.reduce((closest, snapshot) => {
    const closestDelta = Math.abs(closest.timestamp.getTime() - timestamp.getTime());
    const snapshotDelta = Math.abs(snapshot.timestamp.getTime() - timestamp.getTime());
    return snapshotDelta < closestDelta ? snapshot : closest;
  });
}

