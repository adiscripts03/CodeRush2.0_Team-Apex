import { useEffect, useState, type ReactElement } from "react";
import { EocMap } from "../components/EocMap";
import { FloodAnalysisPanel } from "../components/FloodAnalysisPanel";
import { ImpactSummaryPanel } from "../components/ImpactSummaryPanel";
import { PlannerDecisionPanel } from "../components/PlannerDecisionPanel";
import { ReplayControls } from "../components/ReplayControls";
import { ResourceInventoryPanel } from "../components/ResourceInventoryPanel";
import { SnapshotPanel } from "../components/SnapshotPanel";
import { StatusPill } from "../components/StatusPill";
import { frontendEnv } from "../config/env";
import type { ChangeDetectionResponse, FloodSnapshot } from "../flood/flood.types";
import type { ImpactAssessment } from "../impact/impact.types";
import type { PlanRecommendation } from "../planner/planner.types";
import type { Resource, RoutePlan, ShelterCapacity, Vehicle } from "../resources/resource.types";
import { useGisLayers } from "../hooks/useGisLayers";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { useReplayController } from "../hooks/useReplayController";
import { fetchCurrentFlood, fetchFloodChange } from "../services/flood.service";
import { fetchImpactByTimestamp, fetchLatestImpactSummary } from "../services/impact.service";
import { fetchRecommendations, runPlannerApi } from "../services/planner.service";
import { fetchEvacuationRoute, fetchResources } from "../services/resource.service";
import { formatMongoStatus } from "../services/health.service";

export function HomePage(): ReactElement {
  const { health, isLoading, error } = useBackendHealth();
  const gis = useGisLayers();
  const replay = useReplayController();
  const hasMapboxToken = frontendEnv.mapboxAccessToken.length > 0;

  const [floodSnapshot, setFloodSnapshot] = useState<FloodSnapshot | null>(null);
  const [changeData, setChangeData] = useState<ChangeDetectionResponse | null>(null);
  const [impactAssessment, setImpactAssessment] = useState<ImpactAssessment | null>(null);
  const [showChangeOverlay, setShowChangeOverlay] = useState(true);

  const [shelters, setShelters] = useState<ShelterCapacity[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeRoute, setActiveRoute] = useState<RoutePlan | null>(null);

  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);

  // Fetch current flood snapshot, change detection, impact assessment & planner recommendations when replay timestamp changes
  useEffect(() => {
    fetchCurrentFlood()
      .then((res) => setFloodSnapshot(res.snapshot))
      .catch(() => {});

    fetchResources()
      .then((res) => {
        setShelters(res.shelters);
        setResources(res.resources);
        setVehicles(res.vehicles);
      })
      .catch(() => {});

    fetchRecommendations()
      .then((recs) => setRecommendations(recs))
      .catch(() => {});

    if (replay.activeSnapshot?.timestamp) {
      fetchFloodChange(replay.activeSnapshot.timestamp)
        .then((res) => setChangeData(res))
        .catch(() => setChangeData(null));

      fetchImpactByTimestamp(replay.activeSnapshot.timestamp)
        .then((res) => setImpactAssessment(res))
        .catch(() => {
          fetchLatestImpactSummary().then((res) => setImpactAssessment(res)).catch(() => {});
        });

      fetchRecommendations(replay.activeSnapshot.timestamp)
        .then((recs) => setRecommendations(recs))
        .catch(() => {});
    }
  }, [replay.activeSnapshot]);

  const handleRunPlanner = () => {
    runPlannerApi(replay.activeSnapshot?.timestamp)
      .then((res) => setRecommendations(res.recommendations))
      .catch(() => {});
  };

  const handleGenerateRoute = (lng: number, lat: number) => {
    fetchEvacuationRoute(lng, lat, 50)
      .then((route) => setActiveRoute(route))
      .catch(() => {});
  };

  const routeFeatureCollection: GeoJSON.FeatureCollection | null = activeRoute
    ? { type: "FeatureCollection", features: [activeRoute.path] }
    : null;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Emergency Operations Center</p>
          <h1 className="mt-2 text-3xl font-semibold">Kerala Floods 2018 Intelligence Engine</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-700">
            Simulation-first disaster management system with Sentinel-2 flood extent detection, spatial change analysis, impact assessment, safe evacuation routing, agentic decision planning, historical replay, and traceable infrastructure.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Backend</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {isLoading ? <StatusPill label="checking" tone="neutral" /> : null}
              {error ? <StatusPill label="unavailable" tone="warn" /> : null}
              {health ? <StatusPill label={health.status} tone="ok" /> : null}
              {health ? <StatusPill label={`mongo: ${formatMongoStatus(health.dependencies.mongo.status)}`} tone="neutral" /> : null}
            </div>
          </article>

          <article className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Mapbox</h2>
            <div className="mt-4">
              <StatusPill label={hasMapboxToken ? "configured" : "missing token"} tone={hasMapboxToken ? "ok" : "warn"} />
            </div>
          </article>
        </div>

        {/* Replay Controls */}
        <ReplayControls
          timeline={replay.activeTimeline}
          snapshot={replay.activeSnapshot}
          timestampMs={replay.activeTimestampMs}
          sliderValue={replay.sliderValue}
          isPlaying={replay.isPlaying}
          speed={replay.speed}
          isLoading={replay.isLoading}
          error={replay.error}
          onPlay={replay.play}
          onPause={replay.pause}
          onSeek={replay.seek}
          onSpeedChange={replay.setSpeed}
          onStepForward={replay.stepForward}
          onStepBackward={replay.stepBackward}
        />

        {/* Agentic Decision Planner Panel */}
        <PlannerDecisionPanel
          recommendations={recommendations}
          isLoading={replay.isLoading}
          onRunPlanner={handleRunPlanner}
        />

        {/* Flood Detection & Change Intelligence Panel */}
        <FloodAnalysisPanel
          snapshot={floodSnapshot}
          changeData={changeData}
          showChangeOverlay={showChangeOverlay}
          isLoading={replay.isLoading}
          onToggleChangeOverlay={setShowChangeOverlay}
        />

        {/* Impact Assessment Summary Panel */}
        <ImpactSummaryPanel impact={impactAssessment} isLoading={replay.isLoading} />

        {/* Resource Inventory & Evacuation Routing Panel */}
        <ResourceInventoryPanel
          shelters={shelters}
          resources={resources}
          vehicles={vehicles}
          activeRoute={activeRoute}
          isLoading={replay.isLoading}
          onGenerateRoute={handleGenerateRoute}
        />

        {/* Map + GIS Layers sidebar */}
        <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <EocMap
            floodExtent={replay.activeSnapshot?.state.floodExtent ?? null}
            expandedExtent={showChangeOverlay && changeData ? changeData.expandedFeatures : null}
            recededExtent={showChangeOverlay && changeData ? changeData.recededFeatures : null}
            evacuationRoute={routeFeatureCollection}
          />
          <aside className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">GIS Layers</h2>
            <div className="mt-4 flex flex-col gap-3">
              {gis.isLoading ? <StatusPill label="loading layers" tone="neutral" /> : null}
              {gis.error ? <StatusPill label="layers unavailable" tone="warn" /> : null}
              {gis.layers.map((layer) => (
                <div key={layer.layer} className="flex items-center justify-between border-b border-zinc-100 pb-2 text-sm last:border-b-0">
                  <span className="font-medium text-zinc-800">{layer.layer.replace("_", " ")}</span>
                  <span className="text-zinc-500">{layer.count}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {/* Snapshot State Panel */}
        <SnapshotPanel snapshot={replay.activeSnapshot} isLoading={replay.isLoading} />
      </section>
    </main>
  );
}
