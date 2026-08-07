import { AppError } from "../errors/app-error.js";
import { ReplaySnapshotModel } from "../models/replay-snapshot.model.js";
import { ReplayTimelineModel } from "../models/replay-timeline.model.js";
import { MongoAuditService } from "../audit/audit.service.js";
import type { ReplayEventInput } from "./replay.types.js";
import { assertTimestampInTimeline, findClosestSnapshot } from "./timeline-engine.js";

const auditService = new MongoAuditService();

export async function listReplayTimelines(): Promise<unknown[]> {
  return ReplayTimelineModel.find({ hazardType: "flood" }).sort({ startsAt: 1 }).lean();
}

export async function getReplayTimeline(timelineId: string): Promise<unknown> {
  const timeline = await ReplayTimelineModel.findById(timelineId).lean();
  if (!timeline) {
    throw new AppError("Replay timeline not found", 404, "REPLAY_TIMELINE_NOT_FOUND");
  }

  return timeline;
}

export async function getSnapshotAt(timelineId: string, timestamp: Date): Promise<unknown> {
  const timeline = await ReplayTimelineModel.findById(timelineId);
  if (!timeline) {
    throw new AppError("Replay timeline not found", 404, "REPLAY_TIMELINE_NOT_FOUND");
  }

  assertTimestampInTimeline(timeline, timestamp);

  const snapshots = await ReplaySnapshotModel.find({ timelineId }).sort({ timestamp: 1 });
  const snapshot = findClosestSnapshot(snapshots, timestamp);

  if (!snapshot) {
    throw new AppError("Replay snapshot not found", 404, "REPLAY_SNAPSHOT_NOT_FOUND");
  }

  await auditReplayEvent({
    eventType: "replay.snapshot.loaded",
    timelineId,
    timestamp,
    payload: {
      snapshotId: String(snapshot._id),
      snapshotTimestamp: snapshot.timestamp.toISOString()
    }
  });

  return snapshot.toObject();
}

export async function listSnapshots(timelineId: string): Promise<unknown[]> {
  return ReplaySnapshotModel.find({ timelineId }).sort({ timestamp: 1 }).lean();
}

export async function auditReplayEvent(event: ReplayEventInput): Promise<void> {
  await auditService.record({
    eventType: event.eventType,
    actorType: "human",
    actorId: event.actorId,
    correlationId: `replay:${event.timelineId}:${event.timestamp?.toISOString() ?? new Date().toISOString()}`,
    hazardType: "flood",
    payload: {
      timelineId: event.timelineId,
      timestamp: event.timestamp?.toISOString(),
      ...event.payload
    }
  });
}
