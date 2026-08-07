import { z } from "zod";

export const resourceUpdateBodySchema = z.object({
  resourceId: z.string().optional(),
  vehicleId: z.string().optional(),
  shelterId: z.string().optional(),
  quantity: z.number().min(0).optional(),
  status: z.string().optional(),
  occupancy: z.number().min(0).optional()
});

export const evacuationRouteQuerySchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
  originName: z.string().optional(),
  evacueesCount: z.coerce.number().min(1).optional()
});

export const safeRouteQuerySchema = z.object({
  origLng: z.coerce.number().min(-180).max(180),
  origLat: z.coerce.number().min(-90).max(90),
  destLng: z.coerce.number().min(-180).max(180),
  destLat: z.coerce.number().min(-90).max(90),
  origName: z.string().optional(),
  destName: z.string().optional()
});
