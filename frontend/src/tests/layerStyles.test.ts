import { describe, expect, it } from "vitest";
import { gisLayerTypes } from "../gis/gis.types";
import { getGisLayerStyle } from "../gis/layerStyles";

describe("getGisLayerStyle", () => {
  it("creates a Mapbox layer for every GIS layer type", () => {
    for (const layer of gisLayerTypes) {
      const style = getGisLayerStyle(layer);

      expect(style.sourceId).toBe(`gis-${layer}`);
      expect(style.layer.id).toBe(`gis-${layer}`);
    }
  });
});
