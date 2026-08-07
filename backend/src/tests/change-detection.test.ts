import { describe, it, expect } from "vitest";
import {
  computeChangeDetection,
  validateTimestampOrder
} from "../flood/change-detection.engine.js";

function makeSquareFeature(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat]
        ]
      ]
    }
  };
}

describe("validateTimestampOrder", () => {
  it("allows equal or advancing timestamps", () => {
    const t1 = new Date("2018-08-15T00:00:00.000Z");
    const t2 = new Date("2018-08-15T06:00:00.000Z");
    expect(() => validateTimestampOrder(t1, t2)).not.toThrow();
    expect(() => validateTimestampOrder(t1, t1)).not.toThrow();
  });

  it("throws error for inverted timestamp order", () => {
    const t1 = new Date("2018-08-15T06:00:00.000Z");
    const t2 = new Date("2018-08-15T00:00:00.000Z");
    expect(() => validateTimestampOrder(t1, t2)).toThrow(
      "Target timestamp must be equal to or later than baseline timestamp"
    );
  });
});

describe("computeChangeDetection", () => {
  const t1 = new Date("2018-08-15T00:00:00.000Z");
  const t2 = new Date("2018-08-15T06:00:00.000Z");

  it("detects expansion when flood extent grows", () => {
    // Initial polygon (small square)
    const poly1 = makeSquareFeature(76.2, 9.9, 76.3, 10.0);
    // Expanded polygon (larger square enclosing poly1)
    const poly2 = makeSquareFeature(76.2, 9.9, 76.4, 10.1);

    const result = computeChangeDetection([poly1], [poly2], t1, t2);

    expect(result.areaToKm2).toBeGreaterThan(result.areaFromKm2);
    expect(result.netChangeKm2).toBeGreaterThan(0);
    expect(result.expandedAreaKm2).toBeGreaterThan(0);
    expect(result.expansionRateKm2PerHour).toBeGreaterThan(0);
    expect(result.expandedFeatures.features.length).toBeGreaterThan(0);
  });

  it("detects recession when flood extent shrinks", () => {
    const poly1 = makeSquareFeature(76.2, 9.9, 76.4, 10.1);
    const poly2 = makeSquareFeature(76.2, 9.9, 76.3, 10.0);

    const result = computeChangeDetection([poly1], [poly2], t1, t2);

    expect(result.netChangeKm2).toBeLessThan(0);
    expect(result.recededAreaKm2).toBeGreaterThan(0);
    expect(result.recededFeatures.features.length).toBeGreaterThan(0);
  });

  it("handles initial baseline with no prior flood features", () => {
    const poly2 = makeSquareFeature(76.2, 9.9, 76.3, 10.0);
    const result = computeChangeDetection([], [poly2], t1, t2);

    expect(result.areaFromKm2).toBe(0);
    expect(result.expandedAreaKm2).toBeGreaterThan(0);
    expect(result.recededAreaKm2).toBe(0);
  });
});
