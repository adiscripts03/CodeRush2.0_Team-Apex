import * as turf from "@turf/turf";

export interface ShelterAllocationInput {
  shelterId: string;
  name: string;
  maxCapacity: number;
  currentOccupancy: number;
  location: [number, number]; // [lng, lat]
  status: "open" | "near_capacity" | "full" | "flooded";
}

export interface ShelterAllocationResult {
  shelterId: string;
  allocatedCount: number;
  updatedOccupancy: number;
  updatedAvailableCapacity: number;
  newStatus: "open" | "near_capacity" | "full" | "flooded";
}

export function findNearestAvailableShelter<T extends ShelterAllocationInput>(
  originCoords: [number, number],
  shelters: T[]
): T | null {
  const openShelters = shelters.filter(
    (s) => s.status !== "flooded" && s.status !== "full" && s.maxCapacity - s.currentOccupancy > 0
  );

  if (openShelters.length === 0) {
    return null;
  }

  const originPt = turf.point(originCoords);

  return openShelters.reduce((nearest, shelter) => {
    const nearestDist = turf.distance(originPt, turf.point(nearest.location));
    const currentDist = turf.distance(originPt, turf.point(shelter.location));
    return currentDist < nearestDist ? shelter : nearest;
  });
}

export function allocateShelterCapacity(
  shelter: ShelterAllocationInput,
  requestedEvacueesCount: number
): ShelterAllocationResult {
  const available = Math.max(0, shelter.maxCapacity - shelter.currentOccupancy);
  const allocatedCount = Math.min(available, requestedEvacueesCount);
  const updatedOccupancy = shelter.currentOccupancy + allocatedCount;
  const updatedAvailableCapacity = shelter.maxCapacity - updatedOccupancy;

  let newStatus: "open" | "near_capacity" | "full" | "flooded" = shelter.status;
  if (updatedAvailableCapacity === 0) {
    newStatus = "full";
  } else if (updatedOccupancy / shelter.maxCapacity >= 0.8) {
    newStatus = "near_capacity";
  } else {
    newStatus = "open";
  }

  return {
    shelterId: shelter.shelterId,
    allocatedCount,
    updatedOccupancy,
    updatedAvailableCapacity,
    newStatus
  };
}
