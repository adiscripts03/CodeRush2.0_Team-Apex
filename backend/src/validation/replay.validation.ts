import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Expected MongoDB ObjectId");

export const timelineParamsSchema = z.object({
  timelineId: objectIdSchema
});

export const snapshotAtQuerySchema = z.object({
  at: z.string().datetime()
});

export const replayEventBodySchema = z.object({
  eventType: z.enum([
    "replay.timeline.loaded",
    "replay.play.started",
    "replay.play.paused",
    "replay.timestamp.seeked",
    "replay.speed.changed",
    "replay.snapshot.loaded",
    "replay.controller.synced"
  ]),
  timelineId: objectIdSchema,
  timestamp: z.string().datetime().optional(),
  actorId: z.string().min(1).optional(),
  payload: z.record(z.unknown()).optional()
});
