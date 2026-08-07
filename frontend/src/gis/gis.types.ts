export const gisLayerTypes = [
  "district_boundary",
  "road",
  "river",
  "hospital",
  "shelter",
  "population"
] as const;

export type GisLayerType = (typeof gisLayerTypes)[number];

export interface GisLayerSummary {
  layer: GisLayerType;
  count: number;
}
