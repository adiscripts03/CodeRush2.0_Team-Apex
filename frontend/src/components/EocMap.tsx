import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useImperativeHandle, useRef, forwardRef, type ReactElement } from "react";
import type { SimulationMapEvent } from "../services/resilience.service";
import { gisLayerTypes } from "../gis/gis.types";
import { fetchGisLayerFeatures } from "../services/gis.service";

export interface EocMapHandle {
  applySimEvent: (event: SimulationMapEvent) => void;
}

interface EocMapProps {
  floodExtent?: GeoJSON.FeatureCollection | null;
  expandedExtent?: GeoJSON.FeatureCollection | null;
  recededExtent?: GeoJSON.FeatureCollection | null;
  evacuationRoute?: GeoJSON.FeatureCollection | null;
}

const FLOOD_COLORS = ["#93c5fd", "#1d4ed8", "#1e3a8a"]; // Light → Medium → Dark blue

export const EocMap = forwardRef<EocMapHandle, EocMapProps>(function EocMap(
  { floodExtent, expandedExtent, recededExtent, evacuationRoute },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const expandedLayerRef = useRef<L.GeoJSON | null>(null);
  const recededLayerRef = useRef<L.GeoJSON | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const simFloodLayerRef = useRef<L.GeoJSON | null>(null);
  const simMarkersRef = useRef<L.Marker[]>([]);
  const simMessageRef = useRef<HTMLDivElement | null>(null);

  // Expose applySimEvent to parent via ref
  useImperativeHandle(ref, () => ({
    applySimEvent(event: SimulationMapEvent) {
      const map = mapRef.current;
      if (!map) return;

      // Show simulation message banner
      if (simMessageRef.current) {
        simMessageRef.current.textContent = event.message;
        simMessageRef.current.style.opacity = "1";
        setTimeout(() => {
          if (simMessageRef.current) simMessageRef.current.style.opacity = "0";
        }, 3500);
      }

      // Handle flood polygon update
      if (event.floodPolygon) {
        if (simFloodLayerRef.current) {
          map.removeLayer(simFloodLayerRef.current);
          simFloodLayerRef.current = null;
        }

        const stage = (event.floodPolygon.properties?.stage ?? 1) as number;
        const color = FLOOD_COLORS[Math.min(stage - 1, FLOOD_COLORS.length - 1)];
        const isExpanding = event.type === "flood_expand";

        simFloodLayerRef.current = L.geoJSON(event.floodPolygon, {
          style: {
            color: isExpanding ? "#dc2626" : "#1e40af",
            weight: 2.5,
            fillColor: color,
            fillOpacity: isExpanding ? 0.55 : 0.45,
            dashArray: "none"
          }
        });

        simFloodLayerRef.current.addTo(map);

        // Pulse animation — briefly flash border
        const layer = simFloodLayerRef.current;
        let flash = true;
        const flashInterval = setInterval(() => {
          layer.setStyle({ weight: flash ? 4 : 2, opacity: flash ? 1 : 0.6 });
          flash = !flash;
        }, 400);
        setTimeout(() => {
          clearInterval(flashInterval);
          layer.setStyle({ weight: 2.5, opacity: 1 });
        }, 2400);

        // Fit map to flood extent
        const bounds = simFloodLayerRef.current.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
        }
      }

      // Handle marker placement
      if (event.markerPositions && event.markerPositions.length > 0) {
        for (const m of simMarkersRef.current) {
          map.removeLayer(m);
        }
        simMarkersRef.current = [];

        for (const pos of event.markerPositions) {
          const icon = L.divIcon({
            className: "",
            html: `<div style="background:${pos.color};color:white;font-size:11px;font-weight:700;padding:3px 7px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:1.5px solid rgba(255,255,255,0.6)">${pos.label}</div>`,
            iconAnchor: [0, 0]
          });
          const marker = L.marker([pos.lat, pos.lng], { icon });
          marker.addTo(map);
          simMarkersRef.current.push(marker);
        }
      }
    }
  }));

  // Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [10.1, 76.35],
      zoom: 8,
      zoomAnimation: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    mapRef.current = map;

    // Load GIS base layers
    void Promise.all(
      gisLayerTypes.map(async (layer) => {
        try {
          const data = await fetchGisLayerFeatures(layer);
          let color = "#3b82f6";
          let weight = 1;
          if (layer === "district_boundary") { color = "#94a3b8"; weight = 1.5; }
          if (layer === "road") { color = "#64748b"; weight = 1.2; }
          if (layer === "river") { color = "#0ea5e9"; weight = 2; }
          if (layer === "hospital") { color = "#ef4444"; }
          if (layer === "shelter") { color = "#10b981"; }

          L.geoJSON(data, {
            style: () => ({ color, weight, fillColor: color, fillOpacity: 0.1 }),
            pointToLayer: (_f, latlng) =>
              L.circleMarker(latlng, { radius: 5, fillColor: color, color: "#fff", weight: 1, opacity: 1, fillOpacity: 0.85 })
                .bindTooltip(layer, { permanent: false, direction: "top" })
          }).addTo(map);
        } catch { /* ignore */ }
      })
    );

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update prop-driven overlays
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (floodLayerRef.current) { map.removeLayer(floodLayerRef.current); floodLayerRef.current = null; }
    if (floodExtent?.features.length) {
      floodLayerRef.current = L.geoJSON(floodExtent, { style: { color: "#1e40af", weight: 2, fillColor: "#1d4ed8", fillOpacity: 0.4 } }).addTo(map);
    }
  }, [floodExtent]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (expandedLayerRef.current) { map.removeLayer(expandedLayerRef.current); expandedLayerRef.current = null; }
    if (expandedExtent?.features.length) {
      expandedLayerRef.current = L.geoJSON(expandedExtent, { style: { color: "#b91c1c", weight: 2, fillColor: "#dc2626", fillOpacity: 0.45 } }).addTo(map);
    }
  }, [expandedExtent]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (recededLayerRef.current) { map.removeLayer(recededLayerRef.current); recededLayerRef.current = null; }
    if (recededExtent?.features.length) {
      recededLayerRef.current = L.geoJSON(recededExtent, { style: { color: "#15803d", weight: 2, fillColor: "#16a34a", fillOpacity: 0.45 } }).addTo(map);
    }
  }, [recededExtent]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    if (evacuationRoute?.features.length) {
      routeLayerRef.current = L.geoJSON(evacuationRoute, { style: { color: "#059669", weight: 4, dashArray: "6,8" } }).addTo(map);
    }
  }, [evacuationRoute]);

  return (
    <section className="relative h-[36rem] w-full overflow-hidden rounded-lg border border-zinc-300 bg-zinc-100 shadow">
      <div ref={containerRef} className="h-full w-full" />
      {/* Simulation live message banner */}
      <div
        ref={simMessageRef}
        style={{ opacity: 0, transition: "opacity 0.4s" }}
        className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-xl bg-zinc-900/90 px-5 py-2.5 text-sm font-bold text-white shadow-xl backdrop-blur-sm"
      />
      {/* Legend */}
      <div className="absolute top-3 right-3 z-[999] rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 shadow text-xs space-y-1 border border-zinc-200">
        <div className="font-bold text-zinc-800 mb-1">Map Legend</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded" style={{background:"#1d4ed8", opacity:0.7}} />Flood Zone</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded" style={{background:"#10b981"}} />Shelter</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded" style={{background:"#ef4444"}} />Hospital</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded" style={{background:"#0ea5e9"}} />Rivers</div>
        <div className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded" style={{background:"#64748b"}} />Roads</div>
      </div>
    </section>
  );
}) as (props: EocMapProps & { ref?: React.Ref<EocMapHandle> }) => ReactElement;
