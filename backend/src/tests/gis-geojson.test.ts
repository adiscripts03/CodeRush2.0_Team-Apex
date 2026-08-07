import { describe, expect, it } from "vitest";
import { getExternalId, getFeatureName, parseFeatureCollection } from "../gis/geojson.js";

describe("GeoJSON parsing", () => {
  it("parses a valid feature collection", () => {
    const collection = parseFeatureCollection(
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "hospital-1",
            properties: { name: "Test Hospital" },
            geometry: { type: "Point", coordinates: [76.28, 9.98] }
          }
        ]
      })
    );

    expect(collection.features).toHaveLength(1);
    expect(getFeatureName(collection.features[0])).toBe("Test Hospital");
    expect(getExternalId(collection.features[0], 0)).toBe("hospital-1");
  });

  it("rejects unsupported GeoJSON roots", () => {
    expect(() => parseFeatureCollection(JSON.stringify({ type: "Feature", features: [] }))).toThrow();
  });
});
