import { Router } from "express";
import { getAuditTimeline } from "../audit/audit-timeline.service.js";
import { auditTimelineQuerySchema } from "../validation/approval.validation.js";
import { validate } from "../validation/validate.js";

export const auditRouter = Router();

auditRouter.get("/timeline", async (req, res, next) => {
  try {
    const query = validate(auditTimelineQuerySchema, req.query);
    res.json(await getAuditTimeline(query));
  } catch (error) {
    next(error);
  }
});
