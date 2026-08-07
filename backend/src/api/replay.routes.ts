import { Router } from "express";
import {
  auditReplayEvent,
  getReplayTimeline,
  getSnapshotAt,
  listReplayTimelines,
  listSnapshots
} from "../replay/replay.service.js";
import {
  replayEventBodySchema,
  snapshotAtQuerySchema,
  timelineParamsSchema
} from "../validation/replay.validation.js";
import { validate } from "../validation/validate.js";

export const replayRouter = Router();

replayRouter.get("/timelines", async (_req, res, next) => {
  try {
    res.json({ timelines: await listReplayTimelines() });
  } catch (error) {
    next(error);
  }
});

replayRouter.get("/timelines/:timelineId", async (req, res, next) => {
  try {
    const { timelineId } = validate(timelineParamsSchema, req.params);
    res.json(await getReplayTimeline(timelineId));
  } catch (error) {
    next(error);
  }
});

replayRouter.get("/timelines/:timelineId/snapshots", async (req, res, next) => {
  try {
    const { timelineId } = validate(timelineParamsSchema, req.params);
    const at = req.query.at;

    if (typeof at === "string") {
      const query = validate(snapshotAtQuerySchema, req.query);
      res.json(await getSnapshotAt(timelineId, new Date(query.at)));
      return;
    }

    res.json({ snapshots: await listSnapshots(timelineId) });
  } catch (error) {
    next(error);
  }
});

replayRouter.post("/events", async (req, res, next) => {
  try {
    const body = validate(replayEventBodySchema, req.body);
    await auditReplayEvent({
      ...body,
      timestamp: body.timestamp ? new Date(body.timestamp) : undefined
    });
    res.status(202).json({ accepted: true });
  } catch (error) {
    next(error);
  }
});
