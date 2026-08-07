import { frontendEnv } from "../config/env";
import type { Resource, RoutePlan, ShelterCapacity, Vehicle } from "../resources/resource.types";

export async function fetchResources(): Promise<{
  resources: Resource[];
  vehicles: Vehicle[];
  shelters: ShelterCapacity[];
}> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/resources`);
  if (!response.ok) {
    throw new Error(`Resources request failed with status ${response.status}`);
  }
  return response.json();
}

export async function updateResource(input: {
  resourceId?: string;
  vehicleId?: string;
  shelterId?: string;
  quantity?: number;
  status?: string;
  occupancy?: number;
}): Promise<void> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/resources/update`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Resource update failed with status ${response.status}`);
  }
}

export async function fetchEvacuationRoute(
  lng: number,
  lat: number,
  evacueesCount = 50
): Promise<RoutePlan> {
  const url = `${frontendEnv.apiBaseUrl}/api/routes/evacuation?lng=${lng}&lat=${lat}&evacueesCount=${evacueesCount}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Evacuation route request failed with status ${response.status}`);
  }
  return response.json() as Promise<RoutePlan>;
}

export async function fetchSafeRoute(
  origLng: number,
  origLat: number,
  destLng: number,
  destLat: number
): Promise<RoutePlan> {
  const url = `${frontendEnv.apiBaseUrl}/api/routes/safe?origLng=${origLng}&origLat=${origLat}&destLng=${destLng}&destLat=${destLat}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Safe route request failed with status ${response.status}`);
  }
  return response.json() as Promise<RoutePlan>;
}
