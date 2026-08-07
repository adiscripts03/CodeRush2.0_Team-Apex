import { describe, it, expect } from "vitest";
import {
  calculateConfidence,
  computeNdwi,
  processNdwiCells,
  validatePolygon
} from "../flood/ndwi.engine.js";

describe("computeNdwi", () => {
  it("calculates NDWI correctly for positive water signal", () => {
    // Green = 0.5, NIR = 0.1 => (0.5 - 0.1) / (0.5 + 0.1) = 0.4 / 0.6 = 0.667
    const ndwi = computeNdwi(0.5, 0.1);
    expect(ndwi).toBeCloseTo(0.6667, 3);
  });

  it("calculates NDWI correctly for land/vegetation signal", () => {
    // Green = 0.1, NIR = 0.5 => (0.1 - 0.5) / (0.1 + 0.5) = -0.4 / 0.6 = -0.667
    const ndwi = computeNdwi(0.1, 0.5);
    expect(ndwi).toBeCloseTo(-0.6667, 3);
  });

  it("handles zero denominator safely", () => {
    expect(computeNdwi(0, 0)).toBe(0);
  });

  it("clamps extreme values between -1 and 1", () => {
    expect(computeNdwi(1, 0)).toBe(1);
    expect(computeNdwi(0, 1)).toBe(-1);
  });
});

describe("validatePolygon", () => {
  it("validates closed polygon ring", () => {
    const validPoly: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [76.0, 10.0],
          [76.1, 10.0],
          [76.1, 10.1],
          [76.0, 10.1],
          [76.0, 10.0]
        ]
      ]
    };
    expect(validatePolygon(validPoly)).toBe(true);
  });

  it("rejects unclosed polygon ring", () => {
    const unclosedPoly: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [76.0, 10.0],
          [76.1, 10.0],
          [76.1, 10.1],
          [76.0, 10.1]
        ]
      ]
    };
    expect(validatePolygon(unclosedPoly)).toBe(false);
  });

  it("rejects invalid ring length (< 4 points)", () => {
    const shortPoly: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [76.0, 10.0],
          [76.1, 10.0],
          [76.0, 10.0]
        ]
      ]
    };
    expect(validatePolygon(shortPoly)).toBe(false);
  });
});

describe("calculateConfidence", () => {
  it("returns higher confidence score for strong NDWI signal", () => {
    const highConf = calculateConfidence(0.8, 0.3, 0.02);
    const lowConf = calculateConfidence(0.35, 0.3, 0.02);
    expect(highConf).toBeGreaterThan(lowConf);
  });

  it("penalizes cloud cover fraction", () => {
    const clearConf = calculateConfidence(0.6, 0.3, 0.0);
    const cloudyConf = calculateConfidence(0.6, 0.3, 0.5);
    expect(clearConf).toBeGreaterThan(cloudyConf);
  });

  it("remains within [0.1, 1.0] bounds", () => {
    expect(calculateConfidence(1.0, 0.1, 0.0)).toBeLessThanOrEqual(1.0);
    expect(calculateConfidence(0.0, 0.5, 1.0)).toBeGreaterThanOrEqual(0.1);
  });
});

describe("processNdwiCells", () => {
  it("extracts valid flood polygons for cells exceeding threshold", () => {
    const result = processNdwiCells(
      [
        { lng: 76.25, lat: 9.95, green: 0.5, nir: 0.1 }, // NDWI = 0.667 > 0.3
        { lng: 76.30, lat: 10.0, green: 0.1, nir: 0.5 }  // NDWI = -0.667 < 0.3
      ],
      { threshold: 0.3 }
    );

    expect(result.polygonCount).toBe(1);
    expect(result.features).toHaveLength(1);
    expect(result.totalAreaKm2).toBeGreaterThan(0);
    expect(result.overallConfidence).toBeGreaterThan(0.5);
    expect(validatePolygon(result.features[0].geometry)).toBe(true);
  });

  it("returns empty result when no cells exceed threshold", () => {
    const result = processNdwiCells([
      { lng: 76.25, lat: 9.95, green: 0.1, nir: 0.5 }
    ]);

    expect(result.polygonCount).toBe(0);
    expect(result.totalAreaKm2).toBe(0);
    expect(result.features).toEqual([]);
  });
});
