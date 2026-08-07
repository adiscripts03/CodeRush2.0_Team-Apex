import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { importGisCollection } from "../gis/gis.service.js";
import { GisFeatureModel } from "../models/gis-feature.model.js";
import type { GeoJsonFeatureCollectionInput, GisSourceMetadata } from "../gis/gis.types.js";

let mongo: MongoMemoryServer;

const source: GisSourceMetadata = {
  name: "test-source",
  provider: "test",
  license: "test",
  checksum: "checksum",
  importedAt: new Date("2026-08-07T00:00:00.000Z")
};

const hospitals: GeoJsonFeatureCollectionInput = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "hospital-1",
      properties: { name: "Test Hospital" },
      geometry: { type: "Point", coordinates: [76.281, 9.982] }
    }
  ]
};

const districts: GeoJsonFeatureCollectionInput = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "district-1",
      properties: { name: "Ernakulam" },
      geometry: {
        type: "Polygon",
        coordinates: [[[76.15, 9.75], [76.55, 9.75], [76.55, 10.2], [76.15, 10.2], [76.15, 9.75]]]
      }
    }
  ]
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "gis_test" });
  await GisFeatureModel.syncIndexes();
});

beforeEach(async () => {
  await GisFeatureModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("GIS API", () => {
  it("returns imported layer summaries and GeoJSON features", async () => {
    await importGisCollection({ layer: "hospital", collection: hospitals, source });

    const layersResponse = await request(createApp()).get("/api/gis/layers").expect(200);
    expect(layersResponse.body.layers).toEqual([{ layer: "hospital", count: 1 }]);

    const featuresResponse = await request(createApp()).get("/api/gis/layers/hospital/features").expect(200);
    expect(featuresResponse.body.type).toBe("FeatureCollection");
    expect(featuresResponse.body.features[0].properties.name).toBe("Test Hospital");
  });

  it("finds nearby point features", async () => {
    await importGisCollection({ layer: "hospital", collection: hospitals, source });

    const response = await request(createApp())
      .get("/api/gis/nearby")
      .query({ lng: 76.282, lat: 9.981, radiusMeters: 1000, layers: "hospital" })
      .expect(200);

    expect(response.body.features).toHaveLength(1);
    expect(response.body.features[0].name).toBe("Test Hospital");
  });

  it("finds features intersecting a bounding box", async () => {
    await importGisCollection({ layer: "district_boundary", collection: districts, source });

    const response = await request(createApp())
      .get("/api/gis/intersect")
      .query({ bbox: "76.2,9.8,76.3,10.0", layers: "district_boundary" })
      .expect(200);

    expect(response.body.features).toHaveLength(1);
    expect(response.body.features[0].name).toBe("Ernakulam");
  });
});
