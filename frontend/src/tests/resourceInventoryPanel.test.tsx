import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ResourceInventoryPanel } from "../components/ResourceInventoryPanel";
import type { Resource, RoutePlan, ShelterCapacity, Vehicle } from "../resources/resource.types";

afterEach(() => {
  cleanup();
});

const sampleShelters: ShelterCapacity[] = [
  {
    _id: "s1",
    shelterId: "SHELTER_1",
    name: "Ernakulam Town Hall",
    maxCapacity: 1000,
    currentOccupancy: 600,
    availableCapacity: 400,
    status: "open",
    supplies: { foodRationsKg: 5000, medicalKits: 100, drinkingWaterLiters: 8000 }
  }
];

const sampleResources: Resource[] = [
  {
    _id: "r1",
    type: "rescue_boat",
    name: "Rescue Boat Unit Alpha",
    quantity: 12,
    unit: "boats",
    status: "available"
  }
];

const sampleVehicles: Vehicle[] = [
  {
    _id: "v1",
    vehicleId: "V_BOAT_01",
    type: "rescue_boat",
    name: "Boat 01",
    passengerCapacity: 15,
    status: "available"
  }
];

const sampleRoute: RoutePlan = {
  origin: { name: "Evacuation Point", coordinates: [76.26, 9.96] },
  destination: { name: "Ernakulam Town Hall", coordinates: [76.28, 9.98] },
  path: {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [76.26, 9.96],
        [76.28, 9.98]
      ]
    }
  },
  totalDistanceKm: 3.2,
  estimatedTimeMinutes: 6,
  safetyStatus: "safe",
  avoidedFloodAreaKm2: 0
};

describe("ResourceInventoryPanel", () => {
  it("renders loading state", () => {
    render(
      <ResourceInventoryPanel
        shelters={[]}
        resources={[]}
        vehicles={[]}
        activeRoute={null}
        isLoading={true}
      />
    );
    expect(screen.getByText("Loading resource inventory & shelter capacities…")).toBeDefined();
  });

  it("renders shelter capacities and vehicle status pills", () => {
    render(
      <ResourceInventoryPanel
        shelters={sampleShelters}
        resources={sampleResources}
        vehicles={sampleVehicles}
        activeRoute={null}
        isLoading={false}
      />
    );
    expect(screen.getByText("Resource Inventory & Safe Evacuation Routing")).toBeDefined();
    expect(screen.getByText("Ernakulam Town Hall")).toBeDefined();
    expect(screen.getByText("Occupancy: 600 / 1000")).toBeDefined();
    expect(screen.getByText("Boats: 12")).toBeDefined();
  });

  it("renders active evacuation route details when available", () => {
    render(
      <ResourceInventoryPanel
        shelters={sampleShelters}
        resources={sampleResources}
        vehicles={sampleVehicles}
        activeRoute={sampleRoute}
        isLoading={false}
      />
    );
    expect(screen.getByText("Evacuation Route Generator")).toBeDefined();
    expect(screen.getByText("3.2 km")).toBeDefined();
    expect(screen.getByText("6 mins")).toBeDefined();
  });
});
