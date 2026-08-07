import { z } from "zod";
import { gisLayerTypes } from "../gis/gis.types.js";

export const gisLayerSchema = z.enum(gisLayerTypes);

export const layerParamsSchema = z.object({
  layer: gisLayerSchema
});

const layersQuerySchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    return value.split(",").map((layer) => gisLayerSchema.parse(layer.trim()));
  });

export const nearbyQuerySchema = z.object({
  lng: z.coerce.number().min(68).max(98),
  lat: z.coerce.number().min(6).max(38),
  radiusMeters: z.coerce.number().positive().max(100000).default(5000),
  layers: layersQuerySchema
});

export const bboxQuerySchema = z.object({
  bbox: z.string().transform((value) => {
    const parts = value.split(",").map(Number);
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
      throw new Error("bbox must be minLng,minLat,maxLng,maxLat");
    }

    return parts as [number, number, number, number];
  }),
  layers: layersQuerySchema
});
