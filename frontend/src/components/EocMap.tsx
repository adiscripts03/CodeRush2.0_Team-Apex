import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, type ReactElement } from "react";
import { frontendEnv } from "../config/env";
import { gisLayerTypes } from "../gis/gis.types";
import { getGisLayerStyle } from "../gis/layerStyles";
import { fetchGisLayerFeatures } from "../services/gis.service";

interface EocMapProps {
  floodExtent?: GeoJSON.FeatureCollection | null;
  expandedExtent?: GeoJSON.FeatureCollection | null;
  recededExtent?: GeoJSON.FeatureCollection | null;
  evacuationRoute?: GeoJSON.FeatureCollection | null;
}

const FLOOD_SOURCE_ID = "replay-flood-extent";
const FLOOD_FILL_LAYER_ID = "replay-flood-fill";
const FLOOD_OUTLINE_LAYER_ID = "replay-flood-outline";

const EXPANDED_SOURCE_ID = "flood-expanded-extent";
const EXPANDED_FILL_LAYER_ID = "flood-expanded-fill";

const RECEDED_SOURCE_ID = "flood-receded-extent";
const RECEDED_FILL_LAYER_ID = "flood-receded-fill";

const ROUTE_SOURCE_ID = "evacuation-route-source";
const ROUTE_LINE_LAYER_ID = "evacuation-route-line";

const emptyFeatureCollection: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: []
};

export function EocMap({ floodExtent, expandedExtent, recededExtent, evacuationRoute }: EocMapProps): ReactElement {
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

      // Add expanded flood extent layer (red/rose)
      map.addSource(EXPANDED_SOURCE_ID, {
        type: "geojson",
        data: expandedExtent ?? emptyFeatureCollection
      });

      map.addLayer({
        id: EXPANDED_FILL_LAYER_ID,
        type: "fill",
        source: EXPANDED_SOURCE_ID,
        paint: {
          "fill-color": "#e11d48",
          "fill-opacity": 0.5
        }
      });

      // Add receded flood extent layer (emerald green)
      map.addSource(RECEDED_SOURCE_ID, {
        type: "geojson",
        data: recededExtent ?? emptyFeatureCollection
      });

      map.addLayer({
        id: RECEDED_FILL_LAYER_ID,
        type: "fill",
        source: RECEDED_SOURCE_ID,
        paint: {
          "fill-color": "#059669",
          "fill-opacity": 0.4
        }
      });

      // Add evacuation route layer (teal line)
      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: evacuationRoute ?? emptyFeatureCollection
      });

      map.addLayer({
        id: ROUTE_LINE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#0f766e",
          "line-width": 4.5,
          "line-opacity": 0.9,
          "line-dasharray": [2, 1]
        }
      });
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // Update flood extent & change & route data whenever props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const floodSource = map.getSource(FLOOD_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (floodSource) {
      floodSource.setData(floodExtent ?? emptyFeatureCollection);
    }

    const expandedSource = map.getSource(EXPANDED_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (expandedSource) {
      expandedSource.setData(expandedExtent ?? emptyFeatureCollection);
    }

    const recededSource = map.getSource(RECEDED_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (recededSource) {
      recededSource.setData(recededExtent ?? emptyFeatureCollection);
    }

    const routeSource = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (routeSource) {
      routeSource.setData(evacuationRoute ?? emptyFeatureCollection);
    }
  }, [floodExtent, expandedExtent, recededExtent, evacuationRoute]);

  if (frontendEnv.mapboxAccessToken.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded border border-amber-200 bg-amber-50 text-sm text-amber-900">
        Mapbox token is required to render GIS layers.
      </div>
    );
  }

  return <div ref={containerRef} className="h-[520px] w-full rounded border border-zinc-200" />;
}
