import { Router } from "express";
import { generateEvacuationRoute, generateSafeRoute } from "../resources/resource.service.js";
import { evacuationRouteQuerySchema, safeRouteQuerySchema } from "../validation/resource.validation.js";
import { validate } from "../validation/validate.js";

export const routeRouter = Router();

routeRouter.get("/evacuation", async (req, res, next) => {
  try {
    const query = validate(evacuationRouteQuerySchema, req.query);
    const originCoords: [number, number] = [query.lng, query.lat];
    const route = await generateEvacuationRoute(
      originCoords,
      query.originName ?? "Evacuation Point",
      query.evacueesCount ?? 50
    );
    res.json(route);
  } catch (error) {
    next(error);
  }
});

routeRouter.get("/safe", async (req, res, next) => {
  try {
    const query = validate(safeRouteQuerySchema, req.query);
    const route = await generateSafeRoute(
      { name: query.origName ?? "Origin", coordinates: [query.origLng, query.origLat] },
      { name: query.destName ?? "Destination", coordinates: [query.destLng, query.destLat] }
    );
    res.json(route);
  } catch (error) {
    next(error);
  }
});
