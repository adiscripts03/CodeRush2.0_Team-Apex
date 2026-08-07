import { z } from "zod";

export const impactTimestampParamsSchema = z.object({
  timestamp: z.string().datetime()
});

export const impactQuerySchema = z.object({
  timestamp: z.string().datetime().optional()
});
