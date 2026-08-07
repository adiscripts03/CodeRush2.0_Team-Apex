import { describe, it, expect } from "vitest";
import { computeSafeRoute } from "../routing/routing-engine.js";

function makeFloodPolygon(): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [76.25, 9.95],
          [76.35, 9.95],
          [76.35, 10.05],
          [76.25, 10.05],
          [76.25, 9.95]
        ]
      ]
    }
  };
}

describe("computeSafeRoute", () => {
  it("calculates direct safe route when no flood intersects", () => {
    const route = computeSafeRoute({
      origin: { name: "Origin", coordinates: [76.20, 9.90] },
      destination: { name: "Destination", coordinates: [76.22, 9.92] },
      floodPolygons: []
    });

    expect(route.safetyStatus).toBe("safe");
    expect(route.path.geometry.coordinates).toHaveLength(2);
    expect(route.totalDistanceKm).toBeGreaterThan(0);
    expect(route.estimatedTimeMinutes).toBeGreaterThan(0);
  });

  it("calculates detour route when direct path intersects flood polygon", () => {
    const floodPoly = makeFloodPolygon();
    // Direct path from (76.20, 10.00) to (76.40, 10.00) cuts straight through the flood square (76.25..76.35)
    const route = computeSafeRoute({
      origin: { name: "Origin", coordinates: [76.20, 10.00] },
      destination: { name: "Destination", coordinates: [76.40, 10.00] },
      floodPolygons: [floodPoly]
    });

    expect(route.safetyStatus).toBe("caution");
    expect(route.avoidedFloodAreaKm2).toBeGreaterThan(0);
    expect(route.path.geometry.coordinates.length).toBeGreaterThan(2); // Has detour waypoint
  });

  it("returns blocked status when origin and destination are inside flood area", () => {
    const floodPoly = makeFloodPolygon();
    const route = computeSafeRoute({
      origin: { name: "Trapped Start", coordinates: [76.28, 9.98] },
      destination: { name: "Trapped End", coordinates: [76.32, 10.02] },
      floodPolygons: [floodPoly]
    });

    expect(route.safetyStatus).toBe("blocked");
  });
});
