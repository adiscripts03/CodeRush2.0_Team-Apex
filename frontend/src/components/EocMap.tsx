import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, type ReactElement } from "react";
import { gisLayerTypes } from "../gis/gis.types";
import { fetchGisLayerFeatures } from "../services/gis.service";

interface EocMapProps {
  floodExtent?: GeoJSON.FeatureCollection | null;
  expandedExtent?: GeoJSON.FeatureCollection | null;
  recededExtent?: GeoJSON.FeatureCollection | null;
  evacuationRoute?: GeoJSON.FeatureCollection | null;
}

export function EocMap({ floodExtent, expandedExtent, recededExtent, evacuationRoute }: EocMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const expandedLayerRef = useRef<L.GeoJSON | null>(null);
  const recededLayerRef = useRef<L.GeoJSON | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);

  // Initialize Leaflet Map with OpenStreetMap tiles
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined;
    }

    const map = L.map(containerRef.current, {
      center: [10.8505, 76.2711], // Kerala center [lat, lng]
      zoom: 8
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    // Load GIS base layers
    void Promise.all(
      gisLayerTypes.map(async (layer) => {
        try {
          const data = await fetchGisLayerFeatures(layer);
          let color = "#3b82f6";
          if (layer === "district_boundary") color = "#64748b";
          if (layer === "road") color = "#475569";
          if (layer === "river") color = "#0284c7";
          if (layer === "hospital") color = "#ef4444";
          if (layer === "shelter") color = "#10b981";

          L.geoJSON(data, {
            style: () => ({
              color,
              weight: layer === "river" || layer === "road" ? 2 : 1,
              fillColor: color,
              fillOpacity: 0.15
            }),
            pointToLayer: (_feature, latlng) => {
              return L.circleMarker(latlng, {
                radius: 5,
                fillColor: color,
                color: "#ffffff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              });
            }
          }).addTo(map);
        } catch {
          // ignore layer fetch error
        }
      })
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Flood Extent Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (floodLayerRef.current) {
      map.removeLayer(floodLayerRef.current);
      floodLayerRef.current = null;
    }

    if (floodExtent && floodExtent.features.length > 0) {
      floodLayerRef.current = L.geoJSON(floodExtent, {
        style: {
          color: "#1e40af",
          weight: 2,
          fillColor: "#1d4ed8",
          fillOpacity: 0.4
        }
      }).addTo(map);
    }
  }, [floodExtent]);

  // Update Expanded Flood Overlay (Change Detection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (expandedLayerRef.current) {
      map.removeLayer(expandedLayerRef.current);
      expandedLayerRef.current = null;
    }

    if (expandedExtent && expandedExtent.features.length > 0) {
      expandedLayerRef.current = L.geoJSON(expandedExtent, {
        style: {
          color: "#b91c1c",
          weight: 2,
          fillColor: "#dc2626",
          fillOpacity: 0.45
        }
      }).addTo(map);
    }
  }, [expandedExtent]);

  // Update Receded Flood Overlay (Change Detection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (recededLayerRef.current) {
      map.removeLayer(recededLayerRef.current);
      recededLayerRef.current = null;
    }

    if (recededExtent && recededExtent.features.length > 0) {
      recededLayerRef.current = L.geoJSON(recededExtent, {
        style: {
          color: "#15803d",
          weight: 2,
          fillColor: "#16a34a",
          fillOpacity: 0.45
        }
      }).addTo(map);
    }
  }, [recededExtent]);

  // Update Evacuation Route Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (evacuationRoute && evacuationRoute.features.length > 0) {
      routeLayerRef.current = L.geoJSON(evacuationRoute, {
        style: {
          color: "#059669",
          weight: 4,
          dashArray: "6, 8"
        }
      }).addTo(map);
    }
  }, [evacuationRoute]);

  return (
    <section className="relative h-[32rem] w-full overflow-hidden rounded border border-zinc-200 bg-zinc-100 shadow-sm">
      <div ref={containerRef} className="h-full w-full" />
    </section>
  );
}
