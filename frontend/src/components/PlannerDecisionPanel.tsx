import { useState, type ReactElement } from "react";
import type { PlanRecommendation } from "../planner/planner.types";
import { StatusPill } from "./StatusPill";

interface PlannerDecisionPanelProps {
  recommendations: PlanRecommendation[];
  isLoading: boolean;
  onRunPlanner?: () => void;
}

const priorityTone: Record<string, "ok" | "warn" | "neutral"> = {
  critical: "warn",
  high: "warn",
  medium: "neutral",
  low: "ok"
};

export function PlannerDecisionPanel({
  recommendations,
  isLoading,
  onRunPlanner
}: PlannerDecisionPanelProps): ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Synthesizing decision loop recommendations…</p>
      </section>
    );
  }

  const loopStages = [
    { label: "1. Observe", desc: "Flood & GIS Sensors" },
    { label: "2. Estimate", desc: "Impact & Exposure" },
    { label: "3. Explain", desc: "Uncertainty Scoring" },
    { label: "4. Plan", desc: "Policy Generation" },
    { label: "5. Review", desc: "Human Approval Gate" }
  ];

  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Agentic Decision Planner</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Explainable 5-stage decision loop (Observe $\to$ Estimate $\to$ Explain $\to$ Plan $\to$ Review)
            </p>
          </div>
          {onRunPlanner ? (
            <button
              type="button"
              onClick={onRunPlanner}
              className="rounded bg-teal-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-800"
            >
              Run Decision Loop
            </button>
          ) : null}
        </div>

        {/* 5-Step Decision Loop Stepper */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {loopStages.map((step) => (
            <div key={step.label} className="rounded border border-teal-100 bg-teal-50/50 p-2.5 text-center">
              <span className="block text-xs font-bold text-teal-900">{step.label}</span>
              <span className="block text-[11px] text-teal-700 truncate">{step.desc}</span>
            </div>
          ))}
        </div>

        {/* Recommendations List */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Action Recommendations ({recommendations.length})
          </h3>

          {recommendations.length === 0 ? (
            <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              No recommendations generated. Click &quot;Run Decision Loop&quot; to evaluate active hazard conditions.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recommendations.map((rec) => {
                const isExpanded = expandedId === rec.recommendationId;
                const tone = priorityTone[rec.priority] ?? "neutral";

                return (
                  <div key={rec.recommendationId} className="rounded border border-zinc-200 bg-white p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusPill label={rec.actionType.replace("_", " ").toUpperCase()} tone="ok" />
                        <StatusPill label={rec.priority.toUpperCase()} tone={tone} />
                        <h4 className="text-sm font-semibold text-zinc-900">{rec.targetName}</h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 font-mono">
                          Confidence: {(rec.confidenceScore * 100).toFixed(0)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : rec.recommendationId)}
                          className="text-xs font-medium text-teal-700 hover:underline"
                        >
                          {isExpanded ? "Hide Reasoning" : "View Reasoning & Evidence"}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Reasoning & Evidence */}
                    {isExpanded ? (
                      <div className="mt-4 border-t border-zinc-100 pt-3 flex flex-col gap-3 text-xs text-zinc-700">
                        {/* Reasoning */}
                        <div>
                          <span className="font-semibold text-zinc-900">Reasoning Trace:</span>
                          <ul className="mt-1 list-disc pl-4 space-y-1">
                            {rec.reasoning.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Evidence */}
                        {rec.evidence.length > 0 ? (
                          <div>
                            <span className="font-semibold text-zinc-900">Evidence Data Points:</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {rec.evidence.map((ev, idx) => (
                                <span key={idx} className="rounded bg-zinc-100 px-2 py-1 font-mono text-[11px]">
                                  {ev.metric}: <strong>{String(ev.value)}</strong> ({ev.source})
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {/* Constraints & Alternatives */}
                        <div className="grid gap-2 sm:grid-cols-2">
                          {rec.constraints.length > 0 ? (
                            <div className="rounded bg-amber-50 p-2.5 border border-amber-100">
                              <span className="font-semibold text-amber-900">Operational Constraints:</span>
                              <ul className="mt-1 list-disc pl-4 space-y-0.5 text-amber-950">
                                {rec.constraints.map((c, idx) => (
                                  <li key={idx}>{c}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {rec.alternatives.length > 0 ? (
                            <div className="rounded bg-slate-100 p-2.5 border border-slate-200">
                              <span className="font-semibold text-slate-900">Evaluated Alternatives:</span>
                              <ul className="mt-1 space-y-1 text-slate-800">
                                {rec.alternatives.map((alt, idx) => (
                                  <li key={idx}>
                                    <strong>{alt.action}</strong>: <em>{alt.tradeOff}</em>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
