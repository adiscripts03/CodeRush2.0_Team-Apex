import { bboxPolygon } from "@turf/turf";
import type { FeatureCollection, Geometry } from "geojson";
import type { FilterQuery } from "mongoose";
import { GisFeatureModel, type GisFeature } from "../models/gis-feature.model.js";
import type { GeoJsonFeatureCollectionInput, GisLayerType, GisSourceMetadata } from "./gis.types.js";
import { getExternalId, getFeatureName } from "./geojson.js";

export interface ImportGisCollectionInput {
  layer: GisLayerType;
  collection: GeoJsonFeatureCollectionInput;
  source: GisSourceMetadata;
}

export interface NearbyQuery {
  longitude: number;
  latitude: number;
  radiusMeters: number;
  layers?: GisLayerType[];
}

export interface BboxQuery {
  bbox: [number, number, number, number];
  layers?: GisLayerType[];
}

function layerFilter(layers?: GisLayerType[]): FilterQuery<GisFeature> {
  return layers && layers.length > 0 ? { layer: { $in: layers } } : {};
}

export async function importGisCollection(input: ImportGisCollectionInput): Promise<number> {
  const operations = input.collection.features.map((feature, index) => {
    const externalId = getExternalId(feature, index);

    return {
      updateOne: {
        filter: { layer: input.layer, externalId },
        update: {
          $set: {
            layer: input.layer,
            name: getFeatureName(feature),
            externalId,
            geometry: feature.geometry,
            properties: feature.properties ?? {},
            source: input.source
          }
        },
        upsert: true
      }
    };
  });

  if (operations.length === 0) {
    return 0;
  }

  await GisFeatureModel.bulkWrite(operations, { ordered: false });
  return operations.length;
}

export async function listGisLayers(): Promise<Array<{ layer: GisLayerType; count: number }>> {
  const rows = await GisFeatureModel.aggregate<{ _id: GisLayerType; count: number }>([
    { $group: { _id: "$layer", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  return rows.map((row) => ({ layer: row._id, count: row.count }));
}

export async function getLayerFeatureCollection(layer: GisLayerType): Promise<FeatureCollection> {
  const features = await GisFeatureModel.find({ layer }).lean();

  return {
    type: "FeatureCollection",
    features: features.map((feature) => ({
      type: "Feature",
      id: feature.externalId,
      geometry: feature.geometry as Geometry,
      properties: {
        ...feature.properties,
        id: String(feature._id),
        name: feature.name,
        layer: feature.layer,
        sourceName: feature.source.name
      }
    }))
  };
}

export async function findNearbyFeatures(query: NearbyQuery): Promise<GisFeature[]> {
  return GisFeatureModel.find({
    ...layerFilter(query.layers),
    geometry: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [query.longitude, query.latitude]
        },
        $maxDistance: query.radiusMeters
      }
    }
  })
    .limit(100)
    .lean();
}

export async function findFeaturesIntersectingBbox(query: BboxQuery): Promise<GisFeature[]> {
  const polygon = bboxPolygon(query.bbox).geometry;

  return GisFeatureModel.find({
    ...layerFilter(query.layers),
    geometry: {
      $geoIntersects: {
        $geometry: polygon
      }
    }
  })
    .limit(500)
    .lean();
}
