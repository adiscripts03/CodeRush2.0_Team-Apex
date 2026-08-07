import type { ReactElement } from "react";
import { EocMap } from "../components/EocMap";
import { ReplayControls } from "../components/ReplayControls";
import { SnapshotPanel } from "../components/SnapshotPanel";
import { StatusPill } from "../components/StatusPill";
import { frontendEnv } from "../config/env";
import { useGisLayers } from "../hooks/useGisLayers";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { useReplayController } from "../hooks/useReplayController";
import { formatMongoStatus } from "../services/health.service";

export function HomePage(): ReactElement {
  const { health, isLoading, error } = useBackendHealth();
  const gis = useGisLayers();
  const replay = useReplayController();
  const hasMapboxToken = frontendEnv.mapboxAccessToken.length > 0;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Emergency Operations Center</p>
          <h1 className="mt-2 text-3xl font-semibold">Kerala Floods 2018 Foundation</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-700">
            Simulation-first disaster management system with historical replay and traceable infrastructure.
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

        {/* Map + GIS Layers sidebar */}
        <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <EocMap floodExtent={replay.activeSnapshot?.state.floodExtent ?? null} />
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
