import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Building2, Home } from 'lucide-react';

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

export default function MapView({
  geoData,
  layerVisibility,
  activeRoutes = [],
}) {
  const defaultCenter = [9.4981, 76.3388]; // Alappuzha / Kuttanad region
  const defaultZoom = 11;

  const hospitalFeatures = geoData?.hospitals?.features?.slice(0, 150) || [];
  const shelterFeatures = geoData?.shelters?.features?.slice(0, 200) || [];

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* CartoDB Voyager Light Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

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

        {/* Evacuation Route Polylines */}
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

      </MapContainer>
    </div>
  );
}
