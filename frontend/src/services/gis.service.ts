import type { FeatureCollection } from "geojson";
import { frontendEnv } from "../config/env";
import type { GisLayerSummary, GisLayerType } from "../gis/gis.types";

export async function fetchGisLayers(): Promise<GisLayerSummary[]> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/gis/layers`);

  if (!response.ok) {
    throw new Error(`GIS layers request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { layers: GisLayerSummary[] };
  return body.layers;
}

export async function fetchGisLayerFeatures(layer: GisLayerType): Promise<FeatureCollection> {
  const response = await fetch(`${frontendEnv.apiBaseUrl}/api/gis/layers/${layer}/features`);

  if (!response.ok) {
    throw new Error(`GIS layer ${layer} request failed with status ${response.status}`);
  }

  return response.json() as Promise<FeatureCollection>;
}
