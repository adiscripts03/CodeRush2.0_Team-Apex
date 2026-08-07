import { type ReactElement } from "react";
import type { FailureInjection, ResilienceHealthMetrics } from "../resilience/resilience.types";
import { StatusPill } from "./StatusPill";

interface SystemResiliencePanelProps {
  resilienceHealth: ResilienceHealthMetrics | null;
  activeFailures: FailureInjection[];
  offlineQueueCount: number;
  isLoading: boolean;
  onInjectFailure?: (type: FailureInjection["failureType"]) => void;
  onClearFailures?: () => void;
  onSyncOfflineQueue?: () => void;
}

export function SystemResiliencePanel({
  resilienceHealth,
  activeFailures,
  offlineQueueCount,
  isLoading,
  onInjectFailure,
  onClearFailures,
  onSyncOfflineQueue
}: SystemResiliencePanelProps): ReactElement {
  if (isLoading) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Checking system resilience &amp; failure simulator state…</p>
      </section>
    );
  }

  const resilienceIndex = resilienceHealth?.resilienceIndex ?? 100;
  const status = resilienceHealth?.status ?? "healthy";

  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Resilience, Failure Simulation &amp; Offline Sync</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Disaster infrastructure fault injection, degraded mode estimation &amp; offline queue replay
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill label={`SYSTEM: ${status.toUpperCase()}`} tone={status === "healthy" ? "ok" : "warn"} />
            <StatusPill label={`Resilience Index: ${resilienceIndex}%`} tone={resilienceIndex >= 80 ? "ok" : "warn"} />
          </div>
        </div>

        {/* Resilience Index Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
            <span>Uptime Resilience Index</span>
            <span>{resilienceIndex}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                resilienceIndex >= 80 ? "bg-teal-600" : resilienceIndex >= 50 ? "bg-amber-500" : "bg-rose-600"
              }`}
              style={{ width: `${resilienceIndex}%` }}
            />
          </div>
        </div>

        {/* Active Failures & Controls */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Failure Injection Controls */}
          <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
              Failure Simulator Controls
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Inject synthetic infrastructure faults to test degraded fallback policies
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {onInjectFailure ? (
                <>
                  <button
                    type="button"
                    onClick={() => onInjectFailure("comms_tower_outage")}
                    className="rounded bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-200"
                  >
                    + Comms Outage
                  </button>
                  <button
                    type="button"
                    onClick={() => onInjectFailure("sensor_data_loss")}
                    className="rounded bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200"
                  >
                    + Cloud Sensor Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => onInjectFailure("road_network_failure")}
                    className="rounded bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-900 hover:bg-indigo-200"
                  >
                    + Road Failure
                  </button>
                </>
              ) : null}

              {onClearFailures ? (
                <button
                  type="button"
                  onClick={onClearFailures}
                  className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-900"
                >
                  Clear All Failures
                </button>
              ) : null}
            </div>
          </div>

          {/* Active Injections & Offline Queue */}
          <div className="rounded border border-zinc-200 bg-zinc-50 p-4 flex flex-col justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                Active Fault Injections ({activeFailures.length})
              </h3>
              {activeFailures.length === 0 ? (
                <p className="mt-1 text-xs text-zinc-500">All primary sensors &amp; comms operational.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeFailures.map((f) => (
                    <StatusPill key={f.injectionId} label={f.failureType.replace("_", " ")} tone="warn" />
                  ))}
                </div>
              )}
            </div>

            {/* Offline Action Queue */}
            <div className="border-t border-zinc-200 pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-900">Offline Queue:</span>
                <span className="ml-1.5 text-xs text-zinc-600 font-mono">{offlineQueueCount} action(s) pending</span>
              </div>
              {onSyncOfflineQueue && offlineQueueCount > 0 ? (
                <button
                  type="button"
                  onClick={onSyncOfflineQueue}
                  className="rounded bg-teal-700 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-teal-800"
                >
                  Sync Queue
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
