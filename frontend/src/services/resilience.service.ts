import { frontendEnv } from "../config/env";
import type { FailureInjection, ResilienceHealthMetrics } from "../resilience/resilience.types";

export interface AutoSimulationStep {
  step: number;
  name: string;
  status: "success" | "warning" | "info";
  detail: string;
  timestamp?: string;
}

export interface AutoSimulationResponse {
  success: boolean;
  durationMs: number;
  steps: AutoSimulationStep[];
}

export async function injectFailureApi(
  failureType: FailureInjection["failureType"],
  targetComponent = "core_telemetry"
): Promise<FailureInjection> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/simulation/inject-failure`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ failureType, targetComponent })
  });

  if (!response.ok) {
    throw new Error(`Failure injection failed with status ${response.status}`);
  }
  const body = (await response.json()) as { injection: FailureInjection };
  return body.injection;
}

export async function clearFailuresApi(): Promise<{ clearedCount: number }> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/simulation/clear-failures`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Clear failures failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchActiveFailures(): Promise<FailureInjection[]> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/simulation/active-failures`);
  if (!response.ok) {
    throw new Error(`Fetch active failures failed with status ${response.status}`);
  }
  const body = (await response.json()) as { failures: FailureInjection[] };
  return body.failures;
}

export async function fetchResilienceHealth(): Promise<ResilienceHealthMetrics> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/health/resilience`);
  if (!response.ok) {
    throw new Error(`Fetch resilience health failed with status ${response.status}`);
  }
  return response.json() as Promise<ResilienceHealthMetrics>;
}

export async function runAutoSimulationApi(): Promise<AutoSimulationResponse> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/simulation/auto-run`, {
    method: "POST",
    headers: { "content-type": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Auto simulation failed with status ${response.status}`);
  }
  return response.json() as Promise<AutoSimulationResponse>;
}

export interface SimulationMapEvent {
  type: "flood_appear" | "flood_expand" | "shelter_open" | "boat_deploy" | "route_open" | "fault_inject" | "fault_clear" | "evaluation";
  floodPolygon?: GeoJSON.Feature | null;
  markerPositions?: Array<{ lat: number; lng: number; label: string; color: string }>;
  message: string;
}

export interface StreamedSimStep {
  step: number;
  name: string;
  status: "success" | "warning" | "info";
  detail: string;
  mapEvent?: SimulationMapEvent;
}

export function streamAutoSimulation(
  onStep: (step: StreamedSimStep) => void,
  onDone: () => void,
  onError: (msg: string) => void
): () => void {
  const url = `${frontendEnv.apiBaseUrl}/api/simulation/auto-run/stream`;
  const es = new EventSource(url);

  es.addEventListener("step", (e) => {
    try {
      const data = JSON.parse(e.data) as StreamedSimStep;
      onStep(data);
    } catch { /* ignore */ }
  });

  es.addEventListener("done", () => {
    es.close();
    onDone();
  });

  es.addEventListener("error", (e) => {
    es.close();
    onError("Simulation stream error");
  });

  // Return cleanup fn
  return () => es.close();
}
