import type { ReactElement } from "react";
import { StatusPill } from "./StatusPill";
import type { ReplaySnapshot, ReplayTimeline } from "../replay/replay.types";

interface ReplayControlsProps {
  timeline: ReplayTimeline | null;
  snapshot: ReplaySnapshot | null;
  timestampMs: number | null;
  sliderValue: number;
  isPlaying: boolean;
  speed: number;
  isLoading: boolean;
  error: string | null;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (value: number) => void;
  onSpeedChange: (speed: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

const speeds = [1, 2, 4, 8] as const;

function formatTimestamp(timestampMs: number | null): string {
  if (timestampMs === null) {
    return "No timestamp";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(timestampMs));
}

function formatTimelineDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(isoString));
}

export function ReplayControls(props: ReplayControlsProps): ReactElement {
  return (
    <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Historical Replay</h2>
            <p className="mt-1 text-sm text-zinc-600">{props.timeline?.name ?? "No replay timeline loaded"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {props.isLoading ? <StatusPill label="loading" tone="neutral" /> : null}
            {props.error ? <StatusPill label="sync issue" tone="warn" /> : null}
            {props.snapshot ? <StatusPill label={`snapshot ${props.snapshot.sequence}`} tone="ok" /> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!props.timeline}
            type="button"
            onClick={props.onStepBackward}
            aria-label="Step backward"
          >
            ⏮
          </button>
          <button
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!props.timeline}
            type="button"
            onClick={props.isPlaying ? props.onPause : props.onPlay}
          >
            {props.isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!props.timeline}
            type="button"
            onClick={props.onStepForward}
            aria-label="Step forward"
          >
            ⏭
          </button>
          <div className="ml-2 flex items-center gap-1">
            {speeds.map((speed) => (
              <button
                key={speed}
                className={`rounded border px-3 py-2 text-sm font-medium ${
                  props.speed === speed ? "border-teal-700 bg-teal-50 text-teal-900" : "border-zinc-300"
                }`}
                disabled={!props.timeline}
                type="button"
                onClick={() => props.onSpeedChange(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-zinc-700">{formatTimestamp(props.timestampMs)}</span>
            <span className="text-zinc-500">{Math.round(props.sliderValue)}%</span>
          </div>
          <input
            aria-label="Replay timestamp"
            className="w-full accent-teal-700"
            disabled={!props.timeline}
            max={100}
            min={0}
            type="range"
            value={props.sliderValue}
            onChange={(event) => props.onSeek(Number(event.currentTarget.value))}
          />
          {props.timeline ? (
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
              <span>{formatTimelineDate(props.timeline.startsAt)}</span>
              <span>{formatTimelineDate(props.timeline.endsAt)}</span>
            </div>
          ) : null}
        </div>

        {props.snapshot?.state.notes ? <p className="text-sm leading-6 text-zinc-700">{props.snapshot.state.notes}</p> : null}
      </div>
    </section>
  );
}
