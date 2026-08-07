import { z } from "zod";

export const plannerRunBodySchema = z.object({
  timestamp: z.string().datetime().optional()
});

export const recommendationsQuerySchema = z.object({
  timestamp: z.string().datetime().optional()
});

export const explanationParamsSchema = z.object({
  id: z.string().min(1)
});
