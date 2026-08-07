import { frontendEnv } from "../config/env";
import type { ReplayEventType, ReplaySnapshot, ReplayTimeline } from "../replay/replay.types";

export async function fetchReplayTimelines(): Promise<ReplayTimeline[]> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/replay/timelines`);
  if (!response.ok) {
    throw new Error(`Replay timelines request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { timelines: ReplayTimeline[] };
  return body.timelines;
}

export async function fetchSnapshotAt(timelineId: string, timestamp: Date): Promise<ReplaySnapshot> {
  const params = new URLSearchParams({ at: timestamp.toISOString() });
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/replay/timelines/${timelineId}/snapshots?${params}`);
  if (!response.ok) {
    throw new Error(`Replay snapshot request failed with status ${response.status}`);
  }

  return response.json() as Promise<ReplaySnapshot>;
}

export async function auditReplayEvent(input: {
  eventType: ReplayEventType;
  timelineId: string;
  timestamp?: Date;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/replay/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      timestamp: input.timestamp?.toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Replay audit request failed with status ${response.status}`);
  }
}
