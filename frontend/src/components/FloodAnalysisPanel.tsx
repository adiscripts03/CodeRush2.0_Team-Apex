import { useState, type ReactElement } from "react";
import type { ChangeDetectionResponse, FloodSnapshot } from "../flood/flood.types";
import { StatusPill } from "./StatusPill";

interface FloodAnalysisPanelProps {
  snapshot: FloodSnapshot | null;
  changeData: ChangeDetectionResponse | null;
  showChangeOverlay: boolean;
  isLoading: boolean;
  onToggleChangeOverlay: (show: boolean) => void;
  onRunDetection?: () => void;
}

export function FloodAnalysisPanel({
  snapshot,
  changeData,
  showChangeOverlay,
  isLoading,
  onToggleChangeOverlay,
  onRunDetection
}: FloodAnalysisPanelProps): ReactElement {
  const [ndwiThreshold, setNdwiThreshold] = useState(0.3);

  if (isLoading) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Loading flood intelligence data…</p>
      </section>
    );
  }

  const confidencePercentage = snapshot ? Math.round(snapshot.confidenceScore * 100) : 0;
  const tone = confidencePercentage > 75 ? "ok" : confidencePercentage > 50 ? "neutral" : "warn";

  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Flood Intelligence Engine (NDWI)</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {snapshot
                ? `Sentinel-2 Imagery (${snapshot.sourceImageId})`
                : "No active satellite flood snapshot"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {snapshot ? (
              <StatusPill label={`Confidence: ${confidencePercentage}%`} tone={tone} />
            ) : null}
            {snapshot ? <StatusPill label="Sentinel-2 NDWI" tone="ok" /> : null}
          </div>
        </div>

        {/* Current Flood Summary */}
        {snapshot ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded border border-blue-100 bg-blue-50 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Total Flooded Area</span>
              <p className="mt-1 text-2xl font-bold text-blue-950">{snapshot.totalAreaKm2.toFixed(1)} km²</p>
            </div>
            <div className="rounded border border-sky-100 bg-sky-50 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">Detected Zones</span>
              <p className="mt-1 text-2xl font-bold text-sky-950">{snapshot.polygonCount} polygons</p>
            </div>
            <div className="rounded border border-indigo-100 bg-indigo-50 p-4 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">NDWI Threshold</span>
              <p className="mt-1 text-2xl font-bold text-indigo-950">&gt; {ndwiThreshold.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            No flood extent has been detected yet. Run detection or import sample data to visualize flood intelligence.
          </div>
        )}

        {/* Change Detection Summary */}
        {changeData ? (
          <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Change Detection (vs Previous Snapshot)</h3>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showChangeOverlay}
                  onChange={(e) => onToggleChangeOverlay(e.target.checked)}
                  className="rounded accent-teal-700"
                />
                Show Change Overlay on Map
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded bg-rose-100/80 p-3">
                <span className="text-xs font-medium text-rose-800">Expansion Area</span>
                <p className="mt-1 text-lg font-bold text-rose-950">+{changeData.expandedAreaKm2.toFixed(1)} km²</p>
              </div>
              <div className="rounded bg-emerald-100/80 p-3">
                <span className="text-xs font-medium text-emerald-800">Recession Area</span>
                <p className="mt-1 text-lg font-bold text-emerald-950">-{changeData.recededAreaKm2.toFixed(1)} km²</p>
              </div>
              <div className="rounded bg-slate-200/80 p-3">
                <span className="text-xs font-medium text-slate-800">Net Area Change</span>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {changeData.netChangeKm2 >= 0 ? `+${changeData.netChangeKm2}` : changeData.netChangeKm2} km²
                </p>
              </div>
              <div className="rounded bg-amber-100/80 p-3">
                <span className="text-xs font-medium text-amber-800">Expansion Speed</span>
                <p className="mt-1 text-lg font-bold text-amber-950">{changeData.expansionRateKm2PerHour.toFixed(1)} km²/h</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Detection Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span>Adjust Threshold:</span>
            <input
              type="range"
              min="0.1"
              max="0.5"
              step="0.05"
              value={ndwiThreshold}
              onChange={(e) => setNdwiThreshold(parseFloat(e.target.value))}
              className="accent-teal-700"
            />
            <span className="font-mono text-zinc-900">{ndwiThreshold.toFixed(2)}</span>
          </div>

          {onRunDetection ? (
            <button
              type="button"
              onClick={onRunDetection}
              className="rounded bg-teal-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-800"
            >
              Re-run Flood Detection
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
