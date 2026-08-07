import { frontendEnv } from "../config/env";
import type { FailureInjection, ResilienceHealthMetrics } from "../resilience/resilience.types";

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
