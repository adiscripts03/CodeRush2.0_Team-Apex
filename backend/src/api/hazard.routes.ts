import { Router } from "express";
import { listHazards } from "../hazards/registry.js";

export const hazardRouter = Router();

hazardRouter.get("/", (_req, res) => {
  res.json({ hazards: listHazards() });
});
