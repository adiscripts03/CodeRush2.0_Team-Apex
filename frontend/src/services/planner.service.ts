import { frontendEnv } from "../config/env";
import type { DecisionLoopRunResponse, PlanRecommendation } from "../planner/planner.types";

export async function runPlannerApi(timestampIso?: string): Promise<DecisionLoopRunResponse> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/planner/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ timestamp: timestampIso })
  });

  if (!response.ok) {
    throw new Error(`Planner run request failed with status ${response.status}`);
  }
  return response.json() as Promise<DecisionLoopRunResponse>;
}

export async function fetchRecommendations(timestampIso?: string): Promise<PlanRecommendation[]> {
  const url = timestampIso
    ? `${frontendEnv.apiBaseUrl}/api/planner/recommendations?timestamp=${encodeURIComponent(timestampIso)}`
    : `${frontendEnv.apiBaseUrl}/api/planner/recommendations`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch recommendations failed with status ${response.status}`);
  }
  const body = (await response.json()) as { recommendations: PlanRecommendation[] };
  return body.recommendations;
}

export async function fetchExplanation(id: string): Promise<unknown> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/planner/explanation/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Fetch explanation failed with status ${response.status}`);
  }
  return response.json();
}
