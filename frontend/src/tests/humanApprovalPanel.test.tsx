import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { HumanApprovalPanel } from "../components/HumanApprovalPanel";
import type { AuditEventItem } from "../approvals/approval.types";
import type { PlanRecommendation } from "../planner/planner.types";

afterEach(() => {
  cleanup();
});

const samplePending: PlanRecommendation[] = [
  {
    recommendationId: "REC_TEST_201",
    timestamp: "2018-08-15T06:00:00.000Z",
    actionType: "open_shelter",
    targetName: "Kaloor Relief Camp",
    targetId: "SHELTER_KALOOR",
    priority: "critical",
    reasoning: ["Capacity deficit"],
    evidence: [{ metric: "Demand", value: 5000, source: "Impact Engine" }],
    confidenceScore: 0.90,
    constraints: ["Food rations"],
    alternatives: [{ action: "Transfer", tradeOff: "Distance" }],
    status: "proposed"
  }
];

const sampleEvents: AuditEventItem[] = [
  {
    _id: "evt_1",
    eventId: "EVT_101",
    timestamp: "2018-08-15T06:05:00.000Z",
    eventType: "approval.granted",
    actorType: "user",
    actorId: "Commander Sarah",
    correlationId: "corr_101",
    hazardType: "flood",
    payload: { note: "Approved" }
  }
];

describe("HumanApprovalPanel", () => {
  it("renders loading state", () => {
    render(
      <HumanApprovalPanel
        pendingList={[]}
        historyList={[]}
        auditEvents={[]}
        isLoading={true}
      />
    );
    expect(screen.getByText("Loading human approval queue & audit trail…")).toBeDefined();
  });

  it("renders pending approval card and action buttons", () => {
    const handleApprove = vi.fn();
    const handleReject = vi.fn();

    render(
      <HumanApprovalPanel
        pendingList={samplePending}
        historyList={[]}
        auditEvents={sampleEvents}
        isLoading={false}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );

    expect(screen.getByText("Human Approval Workflow & Audit Trail")).toBeDefined();
    expect(screen.getByText("Kaloor Relief Camp")).toBeDefined();
    expect(screen.getByText("Approve Action")).toBeDefined();
    expect(screen.getByText("Reject")).toBeDefined();
  });
});
