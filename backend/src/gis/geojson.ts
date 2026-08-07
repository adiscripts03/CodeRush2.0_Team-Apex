import crypto from "node:crypto";
import type {
  GeoJsonFeatureCollectionInput,
  GeoJsonFeatureInput,
  GeoJsonGeometry,
  GisLayerType
} from "./gis.types.js";

const geometryTypes = new Set(["Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"]);
const layerTypes = new Set(["district_boundary", "road", "river", "hospital", "shelter", "population"]);

export function createChecksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function isGisLayerType(value: string): value is GisLayerType {
  return layerTypes.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGeometry(value: unknown): GeoJsonGeometry {
  if (!isRecord(value)) {
    throw new Error("GeoJSON feature geometry must be an object");
  }

  const type = value.type;
  if (typeof type !== "string" || !geometryTypes.has(type)) {
    throw new Error("GeoJSON feature geometry type is unsupported");
  }

  return {
    type: type as GeoJsonGeometry["type"],
    coordinates: value.coordinates
  };
}

function parseFeature(value: unknown): GeoJsonFeatureInput {
  if (!isRecord(value) || value.type !== "Feature") {
    throw new Error("GeoJSON item must be a Feature");
  }

  return {
    type: "Feature",
    id: typeof value.id === "string" || typeof value.id === "number" ? value.id : undefined,
    geometry: parseGeometry(value.geometry),
    properties: isRecord(value.properties) ? value.properties : {}
  };
}

export function parseFeatureCollection(content: string): GeoJsonFeatureCollectionInput {
  const parsed: unknown = JSON.parse(content);

  if (!isRecord(parsed) || parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    throw new Error("Import file must be a GeoJSON FeatureCollection");
  }

  return {
    type: "FeatureCollection",
    features: parsed.features.map(parseFeature)
  };
}

export function getFeatureName(feature: GeoJsonFeatureInput): string {
  const properties = feature.properties ?? {};
  const candidates = [properties.name, properties.NAME, properties.Name, properties.district, properties.amenity];
  const name = candidates.find((candidate) => typeof candidate === "string" && candidate.length > 0);
  return typeof name === "string" ? name : "Unnamed GIS feature";
}

export function getExternalId(feature: GeoJsonFeatureInput, index: number): string {
  if (typeof feature.id === "string" || typeof feature.id === "number") {
    return String(feature.id);
  }

  const properties = feature.properties ?? {};
  const candidates = [properties.id, properties.osm_id, properties.wikidata, properties.census_code];
  const externalId = candidates.find((candidate) => typeof candidate === "string" || typeof candidate === "number");
  return externalId === undefined ? `feature-${index}` : String(externalId);
}
