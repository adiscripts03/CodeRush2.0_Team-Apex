import { Router } from "express";
import {
  findFeaturesIntersectingBbox,
  findNearbyFeatures,
  getLayerFeatureCollection,
  listGisLayers
} from "../gis/gis.service.js";
import { bboxQuerySchema, layerParamsSchema, nearbyQuerySchema } from "../validation/gis.validation.js";
import { validate } from "../validation/validate.js";

export const gisRouter = Router();

gisRouter.get("/layers", async (_req, res, next) => {
  try {
    res.json({ layers: await listGisLayers() });
  } catch (error) {
    next(error);
  }
});

gisRouter.get("/layers/:layer/features", async (req, res, next) => {
  try {
    const { layer } = validate(layerParamsSchema, req.params);
    res.json(await getLayerFeatureCollection(layer));
  } catch (error) {
    next(error);
  }
});

gisRouter.get("/nearby", async (req, res, next) => {
  try {
    const query = validate(nearbyQuerySchema, req.query);
    const features = await findNearbyFeatures({
      longitude: query.lng,
      latitude: query.lat,
      radiusMeters: query.radiusMeters,
      layers: query.layers
    });
    res.json({ features });
  } catch (error) {
    next(error);
  }
});

gisRouter.get("/intersect", async (req, res, next) => {
  try {
    const query = validate(bboxQuerySchema, req.query);
    const features = await findFeaturesIntersectingBbox(query);
    res.json({ features });
  } catch (error) {
    next(error);
  }
});
