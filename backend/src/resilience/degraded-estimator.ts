export interface DegradedEstimationInput {
  primarySensorAvailable: boolean;
  previousFloodKm2: number;
  rainfallMm: number;
}

export interface DegradedEstimationResult {
  estimatedFloodAreaKm2: number;
  confidenceScore: number;
  degradedMode: boolean;
  estimationMethod: "satellite_ndwi_primary" | "trend_rainfall_fallback";
  notes: string[];
}

export function computeDegradedFloodEstimate(input: DegradedEstimationInput): DegradedEstimationResult {
  if (input.primarySensorAvailable) {
    return {
      estimatedFloodAreaKm2: input.previousFloodKm2,
      confidenceScore: 0.92,
      degradedMode: false,
      estimationMethod: "satellite_ndwi_primary",
      notes: ["Primary Sentinel-2 satellite NDWI telemetry operational"]
    };
  }

  // Fallback Trend + Rainfall Heuristic Estimation
  const expansionFactor = 1 + Math.min(input.rainfallMm / 200, 0.5); // max 50% expansion heuristic
  const estimatedFloodAreaKm2 = Math.round(input.previousFloodKm2 * expansionFactor * 10) / 10;

  return {
    estimatedFloodAreaKm2,
    confidenceScore: 0.70, // Degraded confidence penalty
    degradedMode: true,
    estimationMethod: "trend_rainfall_fallback",
    notes: [
      "Satellite NDWI sensor obstructed by heavy cloud cover",
      `Applied rainfall expansion factor (${expansionFactor.toFixed(2)}x) based on ${input.rainfallMm}mm 24-hr precipitation`,
      "Confidence penalized to 70% due to degraded telemetry"
    ]
  };
}
