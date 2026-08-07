export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface DistrictBreakdown {
  district: string;
  affectedPopulation: number;
  floodedAreaKm2: number;
}

export interface ImpactAssessment {
  _id: string;
  timestamp: string;
  snapshotId: string;
  affectedPopulationCount: number;
  blockedRoadCount: number;
  blockedRoadLengthKm: number;
  affectedHospitalCount: number;
  affectedShelterCount: number;
  affectedSchoolCount: number;
  totalCriticalFacilities: number;
  shelterDemandEstimate: number;
  severityScore: number;
  severityLevel: SeverityLevel;
  districtBreakdown: DistrictBreakdown[];
}

export interface AffectedFacility {
  _id: string;
  facilityId: string;
  facilityName: string;
  facilityType: "hospital" | "shelter" | "school" | "road";
  geometry: GeoJSON.Geometry;
  status: "flooded" | "partially_blocked" | "isolated" | "operational_risk";
}

export interface AffectedPopulation {
  _id: string;
  districtName: string;
  totalPopulation: number;
  exposedPopulation: number;
  exposurePercentage: number;
}
