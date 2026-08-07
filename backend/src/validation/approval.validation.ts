import { z } from "zod";

export const approveBodySchema = z.object({
  recommendationId: z.string().min(1),
  approvedBy: z.string().optional(),
  rationale: z.string().optional()
});

export const rejectBodySchema = z.object({
  recommendationId: z.string().min(1),
  rejectedBy: z.string().optional(),
  rejectionReason: z.string().min(1, { message: "Rejection reason is required" })
});

export const approvalParamsSchema = z.object({
  id: z.string().min(1)
});

export const auditTimelineQuerySchema = z.object({
  limit: z.coerce.number().optional(),
  eventType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});
