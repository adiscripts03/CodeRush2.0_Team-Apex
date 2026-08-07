import { useState, type ReactElement } from "react";
import type { Resource, RoutePlan, ShelterCapacity, Vehicle } from "../resources/resource.types";
import { StatusPill } from "./StatusPill";

interface ResourceInventoryPanelProps {
  shelters: ShelterCapacity[];
  resources: Resource[];
  vehicles: Vehicle[];
  activeRoute: RoutePlan | null;
  isLoading: boolean;
  onGenerateRoute?: (lng: number, lat: number) => void;
}

const statusTone: Record<string, "ok" | "warn" | "neutral"> = {
  open: "ok",
  near_capacity: "neutral",
  full: "warn",
  flooded: "warn",
  available: "ok",
  deployed: "neutral",
  safe: "ok",
  caution: "neutral",
  blocked: "warn"
};

export function ResourceInventoryPanel({
  shelters,
  resources,
  vehicles,
  activeRoute,
  isLoading,
  onGenerateRoute
}: ResourceInventoryPanelProps): ReactElement {
  const [sampleEvacPoint] = useState<[number, number]>([76.26, 9.96]); // Ernakulam West

  if (isLoading) {
    return (
      <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-500">Loading resource inventory &amp; shelter capacities…</p>
      </section>
    );
  }

  const boatCount = resources.find((r) => r.type === "rescue_boat")?.quantity ?? vehicles.filter((v) => v.type === "rescue_boat").length;
  const ambulanceCount = resources.find((r) => r.type === "ambulance")?.quantity ?? vehicles.filter((v) => v.type === "ambulance").length;
  const medicalCount = resources.find((r) => r.type === "medical_team")?.quantity ?? 0;

  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Resource Inventory &amp; Safe Evacuation Routing</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Emergency asset allocation &amp; flood-aware route generation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label={`Boats: ${boatCount}`} tone="ok" />
            <StatusPill label={`Ambulances: ${ambulanceCount}`} tone="ok" />
            <StatusPill label={`Medical: ${medicalCount}`} tone="neutral" />
          </div>
        </div>

        {/* Shelter Capacities */}
        {shelters.length > 0 ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">Shelter Capacities &amp; Occupancy</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {shelters.map((shelter) => {
                const percentage = Math.round((shelter.currentOccupancy / shelter.maxCapacity) * 100);
                const tone = statusTone[shelter.status] ?? "neutral";

                return (
                  <div key={shelter.shelterId} className="rounded border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-900 truncate">{shelter.name}</span>
                      <StatusPill label={shelter.status.replace("_", " ")} tone={tone} />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-600">
                      <span>Occupancy: {shelter.currentOccupancy} / {shelter.maxCapacity}</span>
                      <span className="font-semibold text-zinc-900">{percentage}%</span>
                    </div>

                    <div className="mt-1.5 h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentage >= 90 ? "bg-rose-600" : percentage >= 75 ? "bg-amber-500" : "bg-teal-600"
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Evacuation Route Calculator Widget */}
        <div className="rounded border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-teal-950">Evacuation Route Generator</h3>
              <p className="mt-0.5 text-xs text-teal-800">
                Calculates flood-aware safe path to nearest available shelter bypassing inundated zones
              </p>
            </div>
            {onGenerateRoute ? (
              <button
                type="button"
                onClick={() => onGenerateRoute(sampleEvacPoint[0], sampleEvacPoint[1])}
                className="rounded bg-teal-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-800"
              >
                Calculate Evacuation Route
              </button>
            ) : null}
          </div>

          {activeRoute ? (
            <div className="mt-4 border-t border-teal-200 pt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <span className="text-zinc-600">Destination Shelter:</span>
                <p className="font-semibold text-teal-950 truncate">{activeRoute.destination.name}</p>
              </div>
              <div>
                <span className="text-zinc-600">Route Distance:</span>
                <p className="font-semibold text-teal-950">{activeRoute.totalDistanceKm} km</p>
              </div>
              <div>
                <span className="text-zinc-600">Est. Travel Time:</span>
                <p className="font-semibold text-teal-950">{activeRoute.estimatedTimeMinutes} mins</p>
              </div>
              <div>
                <span className="text-zinc-600">Safety Status:</span>
                <div className="mt-0.5">
                  <StatusPill label={activeRoute.safetyStatus} tone={statusTone[activeRoute.safetyStatus] ?? "ok"} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
