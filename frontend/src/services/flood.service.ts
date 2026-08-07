import { frontendEnv } from "../config/env";
import type { ChangeDetectionResponse, CurrentFloodResponse, FloodSnapshot } from "../flood/flood.types";

export async function fetchCurrentFlood(): Promise<CurrentFloodResponse> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/flood/current`);
  if (!response.ok) {
    throw new Error(`Current flood request failed with status ${response.status}`);
  }
  return response.json() as Promise<CurrentFloodResponse>;
}

export async function fetchFloodHistory(): Promise<FloodSnapshot[]> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/flood/history`);
  if (!response.ok) {
    throw new Error(`Flood history request failed with status ${response.status}`);
  }
  const body = (await response.json()) as { history: FloodSnapshot[] };
  return body.history;
}

export async function fetchFloodChange(timestampIso: string): Promise<ChangeDetectionResponse> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/flood/change/${encodeURIComponent(timestampIso)}`);
  if (!response.ok) {
    throw new Error(`Flood change detection failed with status ${response.status}`);
  }
  return response.json() as Promise<ChangeDetectionResponse>;
}

export async function triggerFloodDetection(input: {
  timestamp: string;
  sourceImageId: string;
  cells: Array<{ lng: number; lat: number; green: number; nir: number }>;
  threshold?: number;
}): Promise<void> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/flood/detect`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Flood detection trigger failed with status ${response.status}`);
  }
}
