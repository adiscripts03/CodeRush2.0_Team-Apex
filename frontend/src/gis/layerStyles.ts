import type { AnyLayer } from "mapbox-gl";
import type { GisLayerType } from "./gis.types";

interface GisLayerStyle {
  sourceId: string;
  layer: AnyLayer;
}

const circlePaint = {
  hospital: {
    "circle-radius": 6,
    "circle-color": "#dc2626",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1
  },
  shelter: {
    "circle-radius": 6,
    "circle-color": "#16a34a",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1
  },
  population: {
    "circle-radius": 7,
    "circle-color": "#7c3aed",
    "circle-opacity": 0.75
  }
} as const;

export function getGisLayerStyle(layer: GisLayerType): GisLayerStyle {
  const sourceId = `gis-${layer}`;

  if (layer === "district_boundary") {
    return {
      sourceId,
      layer: {
        id: sourceId,
        source: sourceId,
        type: "fill",
        paint: {
          "fill-color": "#0f766e",
          "fill-opacity": 0.16,
          "fill-outline-color": "#0f766e"
        }
      }
    };
  }

  if (layer === "road") {
    return {
      sourceId,
      layer: {
        id: sourceId,
        source: sourceId,
        type: "line",
        paint: {
          "line-color": "#52525b",
          "line-width": 3
        }
      }
    };
  }

  if (layer === "river") {
    return {
      sourceId,
      layer: {
        id: sourceId,
        source: sourceId,
        type: "line",
        paint: {
          "line-color": "#0284c7",
          "line-width": 3
        }
      }
    };
  }

  return {
    sourceId,
    layer: {
      id: sourceId,
      source: sourceId,
      type: "circle",
      paint: circlePaint[layer]
    }
  };
}
