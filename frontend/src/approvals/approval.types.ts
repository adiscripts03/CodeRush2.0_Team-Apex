import type { PlanRecommendation } from "../planner/planner.types";

export interface HumanApproval {
  _id: string;
  decisionRecordId: string;
  status: "requested" | "approved" | "rejected" | "expired";
  requestedBy: string;
  approvedBy?: string;
  rationale?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface ApprovalListResponse {
  pending: PlanRecommendation[];
  history: PlanRecommendation[];
  approvals: HumanApproval[];
}

export interface AuditEventItem {
  _id: string;
  eventId: string;
  timestamp: string;
  eventType: string;
  actorType: "system" | "user" | "external";
  actorId?: string;
  correlationId: string;
  hazardType: string;
  payload: Record<string, unknown>;
}

export interface AuditTimelineResponse {
  events: AuditEventItem[];
  count: number;
}
