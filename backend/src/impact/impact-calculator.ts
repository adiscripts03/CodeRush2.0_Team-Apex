import * as turf from "@turf/turf";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface ImpactCalculationInput {
  affectedPopulation: number;
  blockedRoadLengthKm: number;
  affectedHospitalCount: number;
  affectedShelterCount: number;
  affectedSchoolCount: number;
}

export interface ImpactCalculationResult {
  severityScore: number;
  severityLevel: SeverityLevel;
  shelterDemandEstimate: number;
  totalCriticalFacilities: number;
}

export function calculateSeverityScore(input: ImpactCalculationInput): number {
  const popComponent = (input.affectedPopulation / 100_000) * 0.4;
  const roadComponent = (input.blockedRoadLengthKm / 50) * 0.3;
  const hospitalComponent = (input.affectedHospitalCount / 10) * 0.3;

  const rawScore = popComponent + roadComponent + hospitalComponent;
  return Math.round(Math.max(0, Math.min(1.0, rawScore)) * 100) / 100;
}

export function determineSeverityLevel(score: number): SeverityLevel {
  if (score >= 0.8) {
    return "critical";
  }
  if (score >= 0.6) {
    return "high";
  }
  if (score >= 0.3) {
    return "medium";
  }
  return "low";
}

export function estimateShelterDemand(affectedPopulation: number, displacementRatio = 0.2): number {
  return Math.round(Math.max(0, affectedPopulation * displacementRatio));
}

export function calculateImpactMetrics(input: ImpactCalculationInput): ImpactCalculationResult {
  const severityScore = calculateSeverityScore(input);
  const severityLevel = determineSeverityLevel(severityScore);
  const shelterDemandEstimate = estimateShelterDemand(input.affectedPopulation);
  const totalCriticalFacilities =
    input.affectedHospitalCount + input.affectedShelterCount + input.affectedSchoolCount;

  return {
    severityScore,
    severityLevel,
    shelterDemandEstimate,
    totalCriticalFacilities
  };
}

export function isFeatureIntersectingFlood(
  featureGeometry: GeoJSON.Geometry,
  floodPolygons: GeoJSON.Feature[]
): boolean {
  if (!floodPolygons || floodPolygons.length === 0) {
    return false;
  }

  const feat = turf.feature(featureGeometry);

  return floodPolygons.some((floodFeat) => {
    try {
      return turf.booleanIntersects(feat as any, floodFeat as any);
    } catch {
      return false;
    }
  });
}
