import { describe, it, expect } from "vitest";
import {
  calculateImpactMetrics,
  calculateSeverityScore,
  determineSeverityLevel,
  estimateShelterDemand,
  isFeatureIntersectingFlood
} from "../impact/impact-calculator.js";

describe("calculateSeverityScore", () => {
  it("calculates low severity score for minor impact", () => {
    const score = calculateSeverityScore({
      affectedPopulation: 5_000,
      blockedRoadLengthKm: 2,
      affectedHospitalCount: 0,
      affectedShelterCount: 0,
      affectedSchoolCount: 0
    });
    expect(score).toBeLessThan(0.3);
  });

  it("calculates critical severity score for extreme impact", () => {
    const score = calculateSeverityScore({
      affectedPopulation: 250_000,
      blockedRoadLengthKm: 120,
      affectedHospitalCount: 15,
      affectedShelterCount: 8,
      affectedSchoolCount: 12
    });
    expect(score).toBe(1.0);
  });

  it("clamps score within [0.0, 1.0]", () => {
    const zeroScore = calculateSeverityScore({
      affectedPopulation: 0,
      blockedRoadLengthKm: 0,
      affectedHospitalCount: 0,
      affectedShelterCount: 0,
      affectedSchoolCount: 0
    });
    expect(zeroScore).toBe(0.0);
  });
});

describe("determineSeverityLevel", () => {
  it("maps scores to correct severity level badges", () => {
    expect(determineSeverityLevel(0.15)).toBe("low");
    expect(determineSeverityLevel(0.45)).toBe("medium");
    expect(determineSeverityLevel(0.72)).toBe("high");
    expect(determineSeverityLevel(0.92)).toBe("critical");
  });
});

describe("estimateShelterDemand", () => {
  it("calculates 20% displacement demand estimate", () => {
    expect(estimateShelterDemand(100_000)).toBe(20_000);
    expect(estimateShelterDemand(0)).toBe(0);
  });
});

describe("calculateImpactMetrics", () => {
  it("returns complete impact metrics object", () => {
    const metrics = calculateImpactMetrics({
      affectedPopulation: 50_000,
      blockedRoadLengthKm: 15,
      affectedHospitalCount: 2,
      affectedShelterCount: 1,
      affectedSchoolCount: 3
    });

    expect(metrics.severityScore).toBeGreaterThan(0);
    expect(["low", "medium", "high", "critical"]).toContain(metrics.severityLevel);
    expect(metrics.shelterDemandEstimate).toBe(10_000);
    expect(metrics.totalCriticalFacilities).toBe(6);
  });
});

describe("isFeatureIntersectingFlood", () => {
  const floodSquare: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [76.2, 9.9],
          [76.3, 9.9],
          [76.3, 10.0],
          [76.2, 10.0],
          [76.2, 9.9]
        ]
      ]
    }
  };

  it("returns true when feature intersects flood polygon", () => {
    const insidePoint: GeoJSON.Point = {
      type: "Point",
      coordinates: [76.25, 9.95]
    };
    expect(isFeatureIntersectingFlood(insidePoint, [floodSquare])).toBe(true);
  });

  it("returns false when feature is outside flood polygon", () => {
    const outsidePoint: GeoJSON.Point = {
      type: "Point",
      coordinates: [77.5, 11.2]
    };
    expect(isFeatureIntersectingFlood(outsidePoint, [floodSquare])).toBe(false);
  });
});
