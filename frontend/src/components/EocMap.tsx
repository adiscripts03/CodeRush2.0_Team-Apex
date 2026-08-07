import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, type ReactElement } from "react";
import { frontendEnv } from "../config/env";
import { gisLayerTypes } from "../gis/gis.types";
import { getGisLayerStyle } from "../gis/layerStyles";
import { fetchGisLayerFeatures } from "../services/gis.service";

interface EocMapProps {
  floodExtent?: GeoJSON.FeatureCollection | null;
}

const FLOOD_SOURCE_ID = "replay-flood-extent";
const FLOOD_FILL_LAYER_ID = "replay-flood-fill";
const FLOOD_OUTLINE_LAYER_ID = "replay-flood-outline";

const emptyFeatureCollection: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: []
};

export function EocMap({ floodExtent }: EocMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || frontendEnv.mapboxAccessToken.length === 0) {
      return undefined;
    }

    mapboxgl.accessToken = frontendEnv.mapboxAccessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [76.2711, 10.8505],
      zoom: 7
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      void Promise.all(
        gisLayerTypes.map(async (layer) => {
          const data = await fetchGisLayerFeatures(layer);
          const style = getGisLayerStyle(layer);

          if (!map.getSource(style.sourceId)) {
            map.addSource(style.sourceId, {
              type: "geojson",
              data
            });
          }

          if (!map.getLayer(style.layer.id)) {
            map.addLayer(style.layer);
          }
        })
      );

      // Add flood extent source and layers
      map.addSource(FLOOD_SOURCE_ID, {
        type: "geojson",
        data: floodExtent ?? emptyFeatureCollection
      });

      map.addLayer({
        id: FLOOD_FILL_LAYER_ID,
        type: "fill",
        source: FLOOD_SOURCE_ID,
        paint: {
          "fill-color": "#1d4ed8",
          "fill-opacity": 0.35
        }
      });

      map.addLayer({
        id: FLOOD_OUTLINE_LAYER_ID,
        type: "line",
        source: FLOOD_SOURCE_ID,
        paint: {
          "line-color": "#1e40af",
          "line-width": 1.5,
          "line-opacity": 0.7
        }
      });
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // Update flood extent data whenever the prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource(FLOOD_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(floodExtent ?? emptyFeatureCollection);
    }
  }, [floodExtent]);

  if (frontendEnv.mapboxAccessToken.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded border border-amber-200 bg-amber-50 text-sm text-amber-900">
        Mapbox token is required to render GIS layers.
      </div>
    );
  }

  return <div ref={containerRef} className="h-[520px] w-full rounded border border-zinc-200" />;
}
