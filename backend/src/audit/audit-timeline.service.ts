import { AuditEventModel } from "../models/audit-event.model.js";

export interface AuditTimelineQuery {
  limit?: number;
  eventType?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditTimeline(query: AuditTimelineQuery = {}): Promise<{
  events: unknown[];
  count: number;
}> {
  const filter: Record<string, unknown> = {};

  if (query.eventType) {
    filter.eventType = query.eventType;
  }

  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (query.startDate) {
      dateFilter.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      dateFilter.$lte = new Date(query.endDate);
    }
    filter.createdAt = dateFilter;
  }

  const limit = Math.min(Math.max(query.limit || 50, 1), 200);

  const rawEvents = await AuditEventModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const events = rawEvents.map((evt: any) => ({
    ...evt,
    timestamp: evt.createdAt
  }));

  return {
    events,
    count: events.length
  };
}
