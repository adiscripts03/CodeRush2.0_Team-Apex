import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, type ReactElement } from "react";
import { frontendEnv } from "../config/env";
import { gisLayerTypes } from "../gis/gis.types";
import { getGisLayerStyle } from "../gis/layerStyles";
import { fetchGisLayerFeatures } from "../services/gis.service";

export function EocMap(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    });

    return () => {
      map.remove();
    };
  }, []);

  if (frontendEnv.mapboxAccessToken.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded border border-amber-200 bg-amber-50 text-sm text-amber-900">
        Mapbox token is required to render GIS layers.
      </div>
    );
  }

  return <div ref={containerRef} className="h-[520px] w-full rounded border border-zinc-200" />;
}
