import { Router } from "express";
import { evaluateSystemPerformance } from "../evaluation/evaluation.engine.js";
import { generateLearningReport, getConfidenceCalibration } from "../evaluation/learning-report.generator.js";
import { evaluationQuerySchema } from "../validation/evaluation.validation.js";
import { validate } from "../validation/validate.js";

export const evaluationRouter = Router();

evaluationRouter.get("/", async (req, res, next) => {
  try {
    const query = validate(evaluationQuerySchema, req.query);
    const timestamp = query.timestamp ? new Date(query.timestamp) : undefined;
    const result = await evaluateSystemPerformance({ timestamp });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

evaluationRouter.get("/report", async (req, res, next) => {
  try {
    const query = validate(evaluationQuerySchema, req.query);
    const timestamp = query.timestamp ? new Date(query.timestamp) : undefined;
    const report = await generateLearningReport(timestamp);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

evaluationRouter.get("/calibration", async (_req, res, next) => {
  try {
    const calibration = await getConfidenceCalibration();
    res.json({ calibration });
  } catch (error) {
    next(error);
  }
});
