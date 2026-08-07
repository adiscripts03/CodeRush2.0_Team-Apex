import { z } from "zod";

export const detectFloodBodySchema = z.object({
  timestamp: z.string().datetime(),
  sourceImageId: z.string().min(1),
  cells: z
    .array(
      z.object({
        lng: z.number().min(-180).max(180),
        lat: z.number().min(-90).max(90),
        green: z.number().min(0).max(1),
        nir: z.number().min(0).max(1)
      })
    )
    .min(1),
  threshold: z.number().min(-1).max(1).optional(),
  cloudCoverFraction: z.number().min(0).max(1).optional()
});

export const changeParamsSchema = z.object({
  timestamp: z.string().datetime()
});
