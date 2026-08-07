import { Router } from "express";
import { getExplanationById, getRecommendations, runPlanner } from "../planner/planner.service.js";
import { explanationParamsSchema, plannerRunBodySchema, recommendationsQuerySchema } from "../validation/planner.validation.js";
import { validate } from "../validation/validate.js";

export const plannerRouter = Router();

plannerRouter.post("/run", async (req, res, next) => {
  try {
    const body = validate(plannerRunBodySchema, req.body || {});
    const result = await runPlanner(body.timestamp);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

plannerRouter.get("/recommendations", async (req, res, next) => {
  try {
    const query = validate(recommendationsQuerySchema, req.query);
    res.json({ recommendations: await getRecommendations(query.timestamp) });
  } catch (error) {
    next(error);
  }
});

plannerRouter.get("/explanation/:id", async (req, res, next) => {
  try {
    const { id } = validate(explanationParamsSchema, req.params);
    res.json(await getExplanationById(id));
  } catch (error) {
    next(error);
  }
});
