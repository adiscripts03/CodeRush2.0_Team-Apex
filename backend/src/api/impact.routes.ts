import { Router } from "express";
import {
  getAffectedInfrastructure,
  getAffectedPopulation,
  getImpactByTimestamp,
  getLatestImpactSummary
} from "../impact/impact.service.js";
import { impactQuerySchema, impactTimestampParamsSchema } from "../validation/impact.validation.js";
import { validate } from "../validation/validate.js";

export const impactRouter = Router();

impactRouter.get("/summary", async (_req, res, next) => {
  try {
    res.json(await getLatestImpactSummary());
  } catch (error) {
    next(error);
  }
});

impactRouter.get("/population", async (req, res, next) => {
  try {
    const query = validate(impactQuerySchema, req.query);
    res.json({ population: await getAffectedPopulation(query.timestamp) });
  } catch (error) {
    next(error);
  }
});

impactRouter.get("/infrastructure", async (req, res, next) => {
  try {
    const query = validate(impactQuerySchema, req.query);
    res.json({ infrastructure: await getAffectedInfrastructure(query.timestamp) });
  } catch (error) {
    next(error);
  }
});

impactRouter.get("/:timestamp", async (req, res, next) => {
  try {
    const { timestamp } = validate(impactTimestampParamsSchema, req.params);
    res.json(await getImpactByTimestamp(timestamp));
  } catch (error) {
    next(error);
  }
});
