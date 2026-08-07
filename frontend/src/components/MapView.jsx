import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Building2, Home, X, Navigation } from 'lucide-react';

// Custom Leaflet Markers SVG Icons
const hospitalIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
         </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const shelterIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="background-color: #059669; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
         </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Pulsing red icon for the affected/evacuation source location
const affectedIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="position:relative; width:32px; height:32px;">
          <div style="position:absolute; inset:0; background-color: rgba(239,68,68,0.35); border-radius:50%; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:absolute; inset:4px; background-color: #ef4444; border-radius:50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(239,68,68,0.5); display:flex; align-items:center; justify-content:center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          </div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Auto-fit bounds to focused plan markers
function FocusedPlanBounds({ focusedPlan }) {
  const map = useMap();
  useEffect(() => {
    if (!focusedPlan) return;
    const allCoords = [];

    if (focusedPlan.affectedLocation?.coords) {
      allCoords.push(focusedPlan.affectedLocation.coords);
    }
    focusedPlan.assignedShelters?.forEach(s => {
      if (s.coords) allCoords.push(s.coords);
    });
    focusedPlan.assignedHospitals?.forEach(h => {
      if (h.coords) allCoords.push(h.coords);
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords.map(c => [c[0], c[1]]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [focusedPlan, map]);
  return null;
}

export default function MapView({
  geoData,
  layerVisibility,
  activeRoutes = [],
  focusedPlan = null,
  onExitFocusedView = null,
}) {
  const defaultCenter = [9.4981, 76.3388]; // Regional command coordinates
  const defaultZoom = 11;

  const hospitalFeatures = geoData?.hospitals?.features?.slice(0, 150) || [];
  const shelterFeatures = geoData?.shelters?.features?.slice(0, 200) || [];

  // In focused mode, we only show the plan-specific markers/routes
  const isFocused = !!focusedPlan;

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 min-h-[300px]">

      {/* Exit Focused Plan View Button */}
      {isFocused && onExitFocusedView && (
        <button
          onClick={onExitFocusedView}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-lg backdrop-blur-sm border border-white/10 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Exit Plan View</span>
        </button>
      )}

      {/* Focused Plan Info Overlay */}
      {isFocused && (
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl border border-cyan-200 shadow-lg p-3.5 max-w-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Navigation className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Focused Evacuation View</span>
          </div>
          <p className="text-[11px] text-slate-700 font-semibold">{focusedPlan.title}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            {focusedPlan.sourceLocation} → {focusedPlan.targetShelterName} • {focusedPlan.distanceKm} km
          </p>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapResizer />
        {isFocused && <FocusedPlanBounds focusedPlan={focusedPlan} />}

        {/* CartoDB Voyager Light Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* ===== NORMAL MODE: Show all layers as usual ===== */}
        {!isFocused && (
          <>
            {/* Rivers Layer */}
            {layerVisibility?.rivers && geoData?.rivers && (
              <GeoJSON
                key="rivers-layer"
                data={geoData.rivers}
                style={{
                  color: '#0284c7',
                  weight: 2.5,
                  opacity: 0.8,
                }}
              />
            )}

            {/* Roads Layer */}
            {layerVisibility?.roads && geoData?.roads && (
              <GeoJSON
                key="roads-layer"
                data={geoData.roads}
                style={{
                  color: '#d97706',
                  weight: 1.8,
                  opacity: 0.7,
                }}
              />
            )}

            {/* Flood Extent Polygon Layer */}
            {layerVisibility?.flood && geoData?.floodPolygon && (
              <GeoJSON
                key={`flood-layer-${JSON.stringify(geoData.floodPolygon.name || 'active')}`}
                data={geoData.floodPolygon}
                style={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.45,
                  weight: 2.5,
                  dashArray: '4, 4',
                }}
              />
            )}

            {/* Hospital Markers */}
            {layerVisibility?.hospitals && hospitalFeatures.map((hosp, idx) => {
              if (!hosp.geometry) return null;
              const coords = hosp.geometry.type === 'Point'
                ? [hosp.geometry.coordinates[1], hosp.geometry.coordinates[0]]
                : null;
              if (!coords) return null;

              const hospName = hosp.properties?.name || hosp.properties?.['name:en'] || 'Medical Facility';
              const beds = hosp.properties?.beds || 'N/A';
              const phone = hosp.properties?.phone || hosp.properties?.['contact:phone'] || 'N/A';

              return (
                <Marker key={`hosp-${idx}`} position={coords} icon={hospitalIcon}>
                  <Popup>
                    <div className="p-1 space-y-1 text-slate-900">
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                        <Building2 className="w-4 h-4" />
                        <span>{hospName}</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-0.5 font-mono">
                        <p><span className="text-slate-500">Type:</span> {hosp.properties?.amenity || 'Hospital'}</p>
                        <p><span className="text-slate-500">Beds:</span> {beds}</p>
                        <p><span className="text-slate-500">Contact:</span> {phone}</p>
                        <p><span className="text-slate-500">District:</span> {hosp.properties?.['addr:district'] || 'Alappuzha'}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Shelter Markers */}
            {layerVisibility?.shelters && shelterFeatures.map((shelter, idx) => {
              if (!shelter.geometry) return null;
              const coords = shelter.geometry.type === 'Point'
                ? [shelter.geometry.coordinates[1], shelter.geometry.coordinates[0]]
                : null;
              if (!coords) return null;

              const shelterName = shelter.properties?.name || shelter.properties?.['addr:housename'] || 'Relief Centre';
              const osmId = shelter.properties?.['@id'] || shelter.id;
              const cap = geoData?.shelterCapacities?.overrides?.[osmId] || { capacity_total: 200, capacity_available: 150 };

              return (
                <Marker key={`shelter-${idx}`} position={coords} icon={shelterIcon}>
                  <Popup>
                    <div className="p-1 space-y-1 text-slate-900">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                        <Home className="w-4 h-4" />
                        <span>{shelterName}</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-0.5 font-mono">
                        <p><span className="text-slate-500">Available Beds:</span> <span className="text-emerald-600 font-bold">{cap.capacity_available}</span> / {cap.capacity_total}</p>
                        <p><span className="text-slate-500">Facilities:</span> {cap.facilities ? cap.facilities.join(', ') : 'Water, Kitchen, Sanitation'}</p>
                        <p><span className="text-slate-500">Type:</span> {shelter.properties?.amenity || 'School / Relief'}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Evacuation Route Polylines (normal mode) */}
            {activeRoutes.map((route, idx) => (
              <Polyline
                key={`route-${idx}`}
                positions={route.points}
                pathOptions={{
                  color: route.status === 'approved' ? '#059669' : '#d97706',
                  weight: 4,
                  dashArray: route.status === 'approved' ? null : '6, 6',
                  opacity: 0.9,
                }}
              />
            ))}
          </>
        )}

        {/* ===== FOCUSED MODE: Show only plan-specific markers & routes ===== */}
        {isFocused && (
          <>
            {/* Faded flood polygon for context */}
            {geoData?.floodPolygon && (
              <GeoJSON
                key="flood-focused"
                data={geoData.floodPolygon}
                style={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            )}

            {/* Affected Location Marker (pulsing red) */}
            {focusedPlan.affectedLocation?.coords && (
              <Marker
                position={focusedPlan.affectedLocation.coords}
                icon={affectedIcon}
              >
                <Popup>
                  <div className="p-1 text-slate-900">
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                      <Building2 className="w-4 h-4" />
                      <span>{focusedPlan.affectedLocation.name}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      ⚠ Evacuation Source • {focusedPlan.estimatedPatients} evacuees
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Assigned Shelter Markers (green) */}
            {focusedPlan.assignedShelters?.map((shelter, idx) => (
              shelter.coords && (
                <Marker
                  key={`focused-shelter-${idx}`}
                  position={shelter.coords}
                  icon={shelterIcon}
                >
                  <Popup>
                    <div className="p-1 text-slate-900">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                        <Home className="w-4 h-4" />
                        <span>{shelter.name}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Destination Shelter • Capacity: {shelter.capacityAvailable}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Assigned Hospital Markers (if medical evacuation) */}
            {focusedPlan.assignedHospitals?.map((hospital, idx) => (
              hospital.coords && (
                <Marker
                  key={`focused-hospital-${idx}`}
                  position={hospital.coords}
                  icon={hospitalIcon}
                >
                  <Popup>
                    <div className="p-1 text-slate-900">
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                        <Building2 className="w-4 h-4" />
                        <span>{hospital.name}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        At-Risk Hospital • {hospital.estimatedPatients} patients
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}

            {/* Evacuation Route Polylines (focused mode) */}
            {focusedPlan.evacuationRoutes?.map((route, idx) => (
              route.polyline && route.polyline.length >= 2 && (
                <Polyline
                  key={`focused-route-${idx}`}
                  positions={route.polyline}
                  pathOptions={{
                    color: '#0891b2',
                    weight: 5,
                    opacity: 0.9,
                    dashArray: '8, 6',
                  }}
                />
              )
            ))}
          </>
        )}

      </MapContainer>
    </div>
  );
}
