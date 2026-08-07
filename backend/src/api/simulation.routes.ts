import { Router } from "express";
import { clearFailures, getActiveFailures, injectFailure } from "../resilience/failure-simulator.engine.js";
import { injectFailureBodySchema } from "../validation/simulation.validation.js";
import { validate } from "../validation/validate.js";

export const simulationRouter = Router();

simulationRouter.post("/inject-failure", async (req, res, next) => {
  try {
    const body = validate(injectFailureBodySchema, req.body);
    const result = await injectFailure(body);
    res.status(200).json({ success: true, injection: result });
  } catch (error) {
    next(error);
  }
});

simulationRouter.post("/clear-failures", async (_req, res, next) => {
  try {
    const result = await clearFailures();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

simulationRouter.get("/active-failures", async (_req, res, next) => {
  try {
    const failures = await getActiveFailures();
    res.json({ failures, count: failures.length });
  } catch (error) {
    next(error);
  }
});
