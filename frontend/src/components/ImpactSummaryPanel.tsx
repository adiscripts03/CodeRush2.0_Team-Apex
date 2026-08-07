import type { ReactElement } from "react";
import type { ImpactAssessment } from "../impact/impact.types";
import { StatusPill } from "./StatusPill";

interface ImpactSummaryPanelProps {
  impact: ImpactAssessment | null;
  isLoading: boolean;
}

const severityTone: Record<string, "ok" | "warn" | "neutral"> = {
  low: "ok",
  medium: "neutral",
  high: "warn",
  critical: "warn"
};

export function ImpactSummaryPanel({ impact, isLoading }: ImpactSummaryPanelProps): ReactElement {
  if (isLoading) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Evaluating flood impact assessment…</p>
      </section>
    );
  }

  if (!impact) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">No impact assessment available for current flood state.</p>
      </section>
    );
  }

  const tone = severityTone[impact.severityLevel] ?? "warn";

  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Impact Assessment Engine</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Spatial exposure intersection &amp; vulnerability metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill
              label={`Severity: ${impact.severityLevel.toUpperCase()} (${(impact.severityScore * 100).toFixed(0)}%)`}
              tone={tone}
            />
          </div>
        </div>

        {/* Impact Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded border border-rose-100 bg-rose-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Affected Population</span>
            <p className="mt-1 text-2xl font-bold text-rose-950">
              {impact.affectedPopulationCount.toLocaleString()}
            </p>
          </div>

          <div className="rounded border border-amber-100 bg-amber-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Shelter Demand</span>
            <p className="mt-1 text-2xl font-bold text-amber-950">
              {impact.shelterDemandEstimate.toLocaleString()}
            </p>
          </div>

          <div className="rounded border border-slate-200 bg-slate-100 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Blocked Roads</span>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {impact.blockedRoadLengthKm.toFixed(1)} km
            </p>
            <span className="text-xs text-slate-500">({impact.blockedRoadCount} segments)</span>
          </div>

          <div className="rounded border border-purple-100 bg-purple-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Inundated Facilities</span>
            <p className="mt-1 text-2xl font-bold text-purple-950">
              {impact.totalCriticalFacilities}
            </p>
            <span className="text-xs text-purple-700">
              ({impact.affectedHospitalCount} Hospitals, {impact.affectedShelterCount} Shelters)
            </span>
          </div>
        </div>

        {/* District Exposure Breakdown Table */}
        {impact.districtBreakdown.length > 0 ? (
          <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">District Exposure Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-700">
                <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase text-zinc-600">
                  <tr>
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Exposed Population</th>
                    <th className="py-2 px-3">Flooded Area (km²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {impact.districtBreakdown.map((row) => (
                    <tr key={row.district} className="bg-white">
                      <td className="py-2 px-3 font-medium text-zinc-900">{row.district}</td>
                      <td className="py-2 px-3">{row.affectedPopulation.toLocaleString()}</td>
                      <td className="py-2 px-3">{row.floodedAreaKm2.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
