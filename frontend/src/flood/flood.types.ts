export interface FloodSnapshot {
  _id: string;
  timestamp: string;
  sourceImageId: string;
  totalAreaKm2: number;
  polygonCount: number;
  confidenceScore: number;
  status: "processed" | "pending" | "failed";
}

export interface CurrentFloodResponse {
  snapshot: FloodSnapshot | null;
  features: GeoJSON.FeatureCollection;
}

export interface ChangeDetectionResponse {
  timestampFrom: string;
  timestampTo: string;
  timeDeltaHours: number;
  areaFromKm2: number;
  areaToKm2: number;
  netChangeKm2: number;
  expandedAreaKm2: number;
  recededAreaKm2: number;
  persistedAreaKm2: number;
  expansionRateKm2PerHour: number;
  expandedFeatures: GeoJSON.FeatureCollection;
  recededFeatures: GeoJSON.FeatureCollection;
  persistedFeatures: GeoJSON.FeatureCollection;
}
