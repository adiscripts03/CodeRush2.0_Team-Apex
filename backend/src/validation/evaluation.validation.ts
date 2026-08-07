import { z } from "zod";

export const evaluationQuerySchema = z.object({
  timestamp: z.string().datetime().optional()
});
