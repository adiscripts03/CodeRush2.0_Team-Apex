import { frontendEnv } from "../config/env";
import type { ApprovalListResponse, AuditTimelineResponse } from "../approvals/approval.types";

export async function fetchApprovals(): Promise<ApprovalListResponse> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/approvals`);
  if (!response.ok) {
    throw new Error(`Fetch approvals failed with status ${response.status}`);
  }
  return response.json() as Promise<ApprovalListResponse>;
}

export async function approveRecommendationApi(
  recommendationId: string,
  approvedBy = "EOC Command Operator",
  rationale = "Approved for execution"
): Promise<void> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/approvals/${encodeURIComponent(recommendationId)}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ approvedBy, rationale })
  });

  if (!response.ok) {
    throw new Error(`Approve recommendation failed with status ${response.status}`);
  }
}

export async function rejectRecommendationApi(
  recommendationId: string,
  rejectionReason: string,
  rejectedBy = "EOC Command Operator"
): Promise<void> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/approvals/${encodeURIComponent(recommendationId)}/reject`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rejectedBy, rejectionReason })
  });

  if (!response.ok) {
    throw new Error(`Reject recommendation failed with status ${response.status}`);
  }
}

export async function fetchAuditTimeline(limit = 50): Promise<AuditTimelineResponse> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/audit/timeline?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Fetch audit timeline failed with status ${response.status}`);
  }
  return response.json() as Promise<AuditTimelineResponse>;
}
