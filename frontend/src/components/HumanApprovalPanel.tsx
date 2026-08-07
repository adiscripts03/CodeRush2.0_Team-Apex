import { useState, type ReactElement } from "react";
import type { AuditEventItem } from "../approvals/approval.types";
import type { PlanRecommendation } from "../planner/planner.types";
import { StatusPill } from "./StatusPill";

interface HumanApprovalPanelProps {
  pendingList: PlanRecommendation[];
  historyList: PlanRecommendation[];
  auditEvents: AuditEventItem[];
  isLoading: boolean;
  onApprove?: (recommendationId: string) => void;
  onReject?: (recommendationId: string, reason: string) => void;
}

export function HumanApprovalPanel({
  pendingList,
  historyList,
  auditEvents,
  isLoading,
  onApprove,
  onReject
}: HumanApprovalPanelProps): ReactElement {
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "audit">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  if (isLoading) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Loading human approval queue &amp; audit trail…</p>
      </section>
    );
  }

  const handleConfirmReject = (recId: string) => {
    if (!rejectionReason.trim()) {
      return;
    }
    if (onReject) {
      onReject(recId, rejectionReason.trim());
    }
    setRejectingId(null);
    setRejectionReason("");
  };

  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Human Approval Workflow &amp; Audit Trail</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Command approval oversight gate &amp; immutable event timeline
            </p>
          </div>
          <div className="flex rounded border border-zinc-200 bg-zinc-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`rounded px-3 py-1 ${activeTab === "pending" ? "bg-white shadow-xs text-zinc-900 font-semibold" : "text-zinc-600 hover:text-zinc-900"}`}
            >
              Pending ({pendingList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`rounded px-3 py-1 ${activeTab === "history" ? "bg-white shadow-xs text-zinc-900 font-semibold" : "text-zinc-600 hover:text-zinc-900"}`}
            >
              History ({historyList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`rounded px-3 py-1 ${activeTab === "audit" ? "bg-white shadow-xs text-zinc-900 font-semibold" : "text-zinc-600 hover:text-zinc-900"}`}
            >
              Audit Trail ({auditEvents.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Pending Approvals Queue */}
        {activeTab === "pending" ? (
          <div>
            {pendingList.length === 0 ? (
              <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                No pending recommendations awaiting human approval.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingList.map((rec) => (
                  <div key={rec.recommendationId} className="rounded border border-amber-200 bg-amber-50/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusPill label={rec.actionType.replace("_", " ").toUpperCase()} tone="ok" />
                        <StatusPill label={rec.priority.toUpperCase()} tone="warn" />
                        <h4 className="text-sm font-semibold text-zinc-900">{rec.targetName}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {onApprove ? (
                          <button
                            type="button"
                            onClick={() => onApprove(rec.recommendationId)}
                            className="rounded bg-emerald-700 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800"
                          >
                            Approve Action
                          </button>
                        ) : null}

                        {onReject ? (
                          <button
                            type="button"
                            onClick={() => setRejectingId(rec.recommendationId)}
                            className="rounded bg-rose-700 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-rose-800"
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-zinc-700">
                      <p><strong>Reasoning:</strong> {rec.reasoning[0]}</p>
                    </div>

                    {/* Mandatory Rejection Reason Input Drawer */}
                    {rejectingId === rec.recommendationId ? (
                      <div className="mt-3 border-t border-rose-200 pt-3 flex flex-col gap-2 bg-rose-50 p-3 rounded border border-rose-200">
                        <label className="text-xs font-semibold text-rose-950">
                          Mandatory Rejection Rationale:
                        </label>
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejecting this action (required)…"
                          className="rounded border border-rose-300 bg-white px-3 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRejectingId(null)}
                            className="rounded bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmReject(rec.recommendationId)}
                            disabled={!rejectionReason.trim()}
                            className="rounded bg-rose-700 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50 hover:bg-rose-800"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Tab 2: Decision History */}
        {activeTab === "history" ? (
          <div>
            {historyList.length === 0 ? (
              <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                No past decision records found.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {historyList.map((rec) => (
                  <div key={rec.recommendationId} className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 p-3 text-xs">
                    <div>
                      <span className="font-semibold text-zinc-900">{rec.targetName}</span>
                      <span className="ml-2 text-zinc-500">({rec.actionType})</span>
                    </div>
                    <StatusPill
                      label={rec.status.toUpperCase()}
                      tone={rec.status === "executed" || rec.status === "approved" ? "ok" : "warn"}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Tab 3: Immutable Audit Trail */}
        {activeTab === "audit" ? (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {auditEvents.length === 0 ? (
              <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                No audit events logged.
              </div>
            ) : (
              auditEvents.map((evt) => (
                <div key={evt._id || evt.eventId} className="rounded border border-zinc-200 bg-zinc-50/80 p-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="font-semibold text-teal-800">{evt.eventType}</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1 text-zinc-700 truncate">
                    <span>Actor: {evt.actorId || evt.actorType}</span> | <span>Correlation: {evt.correlationId}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
