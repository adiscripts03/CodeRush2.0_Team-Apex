export const gisLayerTypes = [
  "district_boundary",
  "road",
  "river",
  "hospital",
  "shelter",
  "population"
] as const;

export type GisLayerType = (typeof gisLayerTypes)[number];

export interface GisSourceMetadata {
  name: string;
  provider: string;
  license: string;
  sourceUrl?: string;
  checksum: string;
  importedAt: Date;
}

export interface GeoJsonGeometry {
  type: "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";
  coordinates: unknown;
}

export interface GeoJsonFeatureInput {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties?: Record<string, unknown> | null;
  id?: string | number;
}

export interface GeoJsonFeatureCollectionInput {
  type: "FeatureCollection";
  features: GeoJsonFeatureInput[];
}
