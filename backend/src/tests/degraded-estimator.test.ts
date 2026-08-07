import { describe, it, expect } from "vitest";
import { computeDegradedFloodEstimate } from "../resilience/degraded-estimator.js";

describe("computeDegradedFloodEstimate", () => {
  it("uses primary satellite telemetry when sensor is available", () => {
    const res = computeDegradedFloodEstimate({
      primarySensorAvailable: true,
      previousFloodKm2: 25.0,
      rainfallMm: 120
    });

    expect(res.degradedMode).toBe(false);
    expect(res.confidenceScore).toBe(0.92);
    expect(res.estimationMethod).toBe("satellite_ndwi_primary");
  });

  it("calculates rainfall trend expansion and penalizes confidence when primary sensor fails", () => {
    const res = computeDegradedFloodEstimate({
      primarySensorAvailable: false,
      previousFloodKm2: 25.0,
      rainfallMm: 100 // expansion factor: 1 + 100/200 = 1.5 => 25 * 1.5 = 37.5
    });

    expect(res.degradedMode).toBe(true);
    expect(res.confidenceScore).toBe(0.70);
    expect(res.estimatedFloodAreaKm2).toBe(37.5);
    expect(res.estimationMethod).toBe("trend_rainfall_fallback");
  });
});
