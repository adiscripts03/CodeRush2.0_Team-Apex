import { Router } from "express";
import { getHealth } from "../services/health.service.js";
import { getResilienceHealthMetrics } from "../resilience/resilience-health.service.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json(getHealth());
});

healthRouter.get("/resilience", async (_req, res, next) => {
  try {
    const metrics = await getResilienceHealthMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});
