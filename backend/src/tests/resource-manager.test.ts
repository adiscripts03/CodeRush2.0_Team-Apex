import { describe, it, expect } from "vitest";
import {
  allocateShelterCapacity,
  findNearestAvailableShelter,
  type ShelterAllocationInput
} from "../resources/resource-manager.js";

const mockShelters: ShelterAllocationInput[] = [
  {
    shelterId: "SHELTER_1",
    name: "Far Shelter",
    maxCapacity: 500,
    currentOccupancy: 100,
    location: [76.40, 10.20],
    status: "open"
  },
  {
    shelterId: "SHELTER_2",
    name: "Near Open Shelter",
    maxCapacity: 1000,
    currentOccupancy: 400,
    location: [76.28, 9.98],
    status: "open"
  },
  {
    shelterId: "SHELTER_3",
    name: "Near Full Shelter",
    maxCapacity: 500,
    currentOccupancy: 500,
    location: [76.27, 9.97],
    status: "full"
  }
];

describe("findNearestAvailableShelter", () => {
  it("selects nearest open shelter with available capacity", () => {
    const originCoords: [number, number] = [76.26, 9.96];
    const selected = findNearestAvailableShelter(originCoords, mockShelters);

    expect(selected).not.toBeNull();
    expect(selected!.shelterId).toBe("SHELTER_2"); // Ignores full shelter 3 and far shelter 1
  });

  it("returns null if no shelter has available capacity", () => {
    const fullShelters = mockShelters.map((s) => ({ ...s, currentOccupancy: s.maxCapacity, status: "full" as const }));
    const selected = findNearestAvailableShelter([76.26, 9.96], fullShelters);
    expect(selected).toBeNull();
  });
});

describe("allocateShelterCapacity", () => {
  it("allocates requested evacuees within available capacity", () => {
    const shelter = mockShelters[1]; // max: 1000, curr: 400
    const alloc = allocateShelterCapacity(shelter, 200);

    expect(alloc.allocatedCount).toBe(200);
    expect(alloc.updatedOccupancy).toBe(600);
    expect(alloc.updatedAvailableCapacity).toBe(400);
    expect(alloc.newStatus).toBe("open");
  });

  it("updates status to near_capacity when occupancy >= 80%", () => {
    const shelter = mockShelters[1]; // max: 1000, curr: 400
    const alloc = allocateShelterCapacity(shelter, 420); // occupancy becomes 820 (82%)

    expect(alloc.allocatedCount).toBe(420);
    expect(alloc.updatedOccupancy).toBe(820);
    expect(alloc.newStatus).toBe("near_capacity");
  });

  it("updates status to full when capacity is exhausted", () => {
    const shelter = mockShelters[1]; // max: 1000, curr: 400
    const alloc = allocateShelterCapacity(shelter, 700); // capped at 600 available

    expect(alloc.allocatedCount).toBe(600);
    expect(alloc.updatedOccupancy).toBe(1000);
    expect(alloc.updatedAvailableCapacity).toBe(0);
    expect(alloc.newStatus).toBe("full");
  });
});
