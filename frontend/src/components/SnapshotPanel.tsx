import type { ReactElement } from "react";
import type { ReplaySnapshot } from "../replay/replay.types";

interface SnapshotPanelProps {
  snapshot: ReplaySnapshot | null;
  isLoading: boolean;
}

const trendArrow: Record<string, string> = {
  rising: "↑",
  falling: "↓",
  stable: "→"
};

const trendColor: Record<string, string> = {
  rising: "text-red-600",
  falling: "text-emerald-600",
  stable: "text-zinc-500"
};

const conditionLabel: Record<string, string> = {
  heavy_rain: "🌧️ Heavy Rain",
  extreme_rain: "⛈️ Extreme Rain",
  moderate_rain: "🌦️ Moderate Rain",
  light_rain: "🌤️ Light Rain",
  clear: "☀️ Clear"
};

function formatCondition(condition: unknown): string {
  if (typeof condition !== "string") {
    return "Unknown";
  }
  return conditionLabel[condition] ?? condition.replace(/_/g, " ");
}

function formatTimestamp(ts: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(ts));
}

export function SnapshotPanel({ snapshot, isLoading }: SnapshotPanelProps): ReactElement {
  if (isLoading) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Loading snapshot…</p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">No snapshot loaded. Select a timeline and press Play to begin.</p>
      </section>
    );
  }

  const { state } = snapshot;
  const weather = state.weather as Record<string, unknown> | undefined;
  const riverLevels = (state.riverLevels ?? []) as Array<Record<string, unknown>>;

  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Snapshot #{snapshot.sequence}</h2>
          <span className="text-sm text-zinc-500">{formatTimestamp(snapshot.timestamp)}</span>
        </div>

        {/* Weather */}
        {weather ? (
          <div className="rounded border border-blue-100 bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">Weather</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium text-blue-800">{formatCondition(weather.condition)}</span>
              {typeof weather.rainfallMm === "number" ? (
                <span className="text-blue-700">
                  💧 {weather.rainfallMm} mm
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* River Levels */}
        {riverLevels.length > 0 ? (
          <div className="rounded border border-cyan-100 bg-cyan-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-cyan-900">River Levels</h3>
            <div className="flex flex-col gap-2">
              {riverLevels.map((river, index) => {
                const station = typeof river.station === "string" ? river.station : `Station ${index + 1}`;
                const level = typeof river.levelMeters === "number" ? river.levelMeters : null;
                const trend = typeof river.trend === "string" ? river.trend : "stable";

                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-cyan-800">{station}</span>
                    <div className="flex items-center gap-2">
                      {level !== null ? (
                        <span className="text-cyan-700">{level.toFixed(1)} m</span>
                      ) : null}
                      <span className={`font-bold ${trendColor[trend] ?? "text-zinc-500"}`}>
                        {trendArrow[trend] ?? "→"} {trend}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Flood Extent Summary */}
        {snapshot.state.floodExtent ? (
          <div className="rounded border border-amber-100 bg-amber-50 p-4">
            <h3 className="mb-1 text-sm font-semibold text-amber-900">Flood Extent</h3>
            <p className="text-sm text-amber-700">
              {snapshot.state.floodExtent.features.length} zone{snapshot.state.floodExtent.features.length !== 1 ? "s" : ""} affected
            </p>
          </div>
        ) : null}

        {/* Notes */}
        {state.notes ? (
          <p className="text-sm leading-6 text-zinc-700 border-t border-zinc-100 pt-3">{state.notes}</p>
        ) : null}
      </div>
    </section>
  );
}
