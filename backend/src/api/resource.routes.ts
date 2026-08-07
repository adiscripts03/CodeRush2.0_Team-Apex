import { Router } from "express";
import { getAllResources, updateResourceStatus } from "../resources/resource.service.js";
import { resourceUpdateBodySchema } from "../validation/resource.validation.js";
import { validate } from "../validation/validate.js";

export const resourceRouter = Router();

resourceRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await getAllResources());
  } catch (error) {
    next(error);
  }
});

resourceRouter.post("/update", async (req, res, next) => {
  try {
    const body = validate(resourceUpdateBodySchema, req.body);
    const updated = await updateResourceStatus(body);
    res.json({ success: true, resource: updated });
  } catch (error) {
    next(error);
  }
});
