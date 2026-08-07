import { Router } from "express";
import {
  getCurrentFlood,
  getFloodChange,
  getFloodHistory,
  runFloodDetection
} from "../flood/flood.service.js";
import { changeParamsSchema, detectFloodBodySchema } from "../validation/flood.validation.js";
import { validate } from "../validation/validate.js";

export const floodRouter = Router();

floodRouter.get("/current", async (_req, res, next) => {
  try {
    res.json(await getCurrentFlood());
  } catch (error) {
    next(error);
  }
});

floodRouter.get("/history", async (_req, res, next) => {
  try {
    res.json({ history: await getFloodHistory() });
  } catch (error) {
    next(error);
  }
});

floodRouter.post("/detect", async (req, res, next) => {
  try {
    const body = validate(detectFloodBodySchema, req.body);
    const result = await runFloodDetection(body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

floodRouter.get("/change/:timestamp", async (req, res, next) => {
  try {
    const { timestamp } = validate(changeParamsSchema, req.params);
    res.json(await getFloodChange(timestamp));
  } catch (error) {
    next(error);
  }
});
