import { frontendEnv } from "../config/env";
import type { AffectedFacility, AffectedPopulation, ImpactAssessment } from "../impact/impact.types";

export async function fetchLatestImpactSummary(): Promise<ImpactAssessment | null> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/impact/summary`);
  if (!response.ok) {
    throw new Error(`Impact summary request failed with status ${response.status}`);
  }
  const body = (await response.json()) as ImpactAssessment | { assessment: null };
  if ("assessment" in body && body.assessment === null) {
    return null;
  }
  return body as ImpactAssessment;
}

export async function fetchImpactByTimestamp(timestampIso: string): Promise<ImpactAssessment> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/impact/${encodeURIComponent(timestampIso)}`);
  if (!response.ok) {
    throw new Error(`Impact assessment request failed with status ${response.status}`);
  }
  return response.json() as Promise<ImpactAssessment>;
}

export async function fetchAffectedPopulation(timestampIso?: string): Promise<AffectedPopulation[]> {
  const url = timestampIso
    ? `${frontendEnv.apiBaseUrl}/api/impact/population?timestamp=${encodeURIComponent(timestampIso)}`
    : `${frontendEnv.apiBaseUrl}/api/impact/population`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Affected population request failed with status ${response.status}`);
  }
  const body = (await response.json()) as { population: AffectedPopulation[] };
  return body.population;
}

export async function fetchAffectedInfrastructure(timestampIso?: string): Promise<AffectedFacility[]> {
  const url = timestampIso
    ? `${frontendEnv.apiBaseUrl}/api/impact/infrastructure?timestamp=${encodeURIComponent(timestampIso)}`
    : `${frontendEnv.apiBaseUrl}/api/impact/infrastructure`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Affected infrastructure request failed with status ${response.status}`);
  }
  const body = (await response.json()) as { infrastructure: AffectedFacility[] };
  return body.infrastructure;
}
