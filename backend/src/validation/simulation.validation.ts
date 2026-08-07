import { z } from "zod";

export const injectFailureBodySchema = z.object({
  failureType: z.enum([
    "comms_tower_outage",
    "sensor_data_loss",
    "road_network_failure",
    "shelter_overflow",
    "network_latency"
  ]),
  targetComponent: z.string().optional(),
  latencyMs: z.number().optional(),
  errorRate: z.number().optional(),
  affectedZones: z.array(z.string()).optional()
});
