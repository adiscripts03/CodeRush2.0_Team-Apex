import { Router } from "express";
import { approveRecommendation, listApprovals, rejectRecommendation } from "../approvals/approval.service.js";
import { approveBodySchema, rejectBodySchema } from "../validation/approval.validation.js";
import { validate } from "../validation/validate.js";

export const approvalRouter = Router();

approvalRouter.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    res.json(await listApprovals(status));
  } catch (error) {
    next(error);
  }
});

approvalRouter.post("/approve", async (req, res, next) => {
  try {
    const body = validate(approveBodySchema, req.body);
    const result = await approveRecommendation(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

approvalRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const recommendationId = req.params.id;
    const body = validate(approveBodySchema, { recommendationId, ...(req.body || {}) });
    const result = await approveRecommendation(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

approvalRouter.post("/reject", async (req, res, next) => {
  try {
    const body = validate(rejectBodySchema, req.body);
    const result = await rejectRecommendation(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

approvalRouter.post("/:id/reject", async (req, res, next) => {
  try {
    const recommendationId = req.params.id;
    const body = validate(rejectBodySchema, { recommendationId, ...(req.body || {}) });
    const result = await rejectRecommendation(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
