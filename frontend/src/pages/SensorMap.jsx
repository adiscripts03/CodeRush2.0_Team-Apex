import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { useApp } from '../state/AppContext';
import { ArrowLeft, Activity, MapPin, AlertTriangle } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

// Component to handle Leaflet resize invalidation
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

// Component to auto-fit map bounds
function AutoFitBounds({ markers }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers && markers.length > 0) {
      const validMarkers = markers.filter(m => m.lat && m.lng);
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    }
  }, [map, markers]);

  return null;
}

// Helper for status to color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'normal':
      return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-600', isPulsing: false };
    case 'orange alert':
      return { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-600', isPulsing: false };
    case 'red alert':
      return { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-600', isPulsing: true };
    case 'overflowing':
      return { bg: 'bg-rose-700', text: 'text-rose-900', border: 'border-rose-800', isPulsing: true };
    default:
      return { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-600', isPulsing: false };
  }
};

const createCustomIcon = (status) => {
  const { bg, border, isPulsing } = getStatusColor(status);
  
  const pulseHtml = isPulsing 
    ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full ${bg} opacity-75"></span>` 
    : '';

  const html = `
    <div class="relative flex h-6 w-6 items-center justify-center">
      ${pulseHtml}
      <span class="relative inline-flex rounded-full h-4 w-4 ${bg} border-2 ${border} shadow-md"></span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-sensor-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export default function SensorMap() {
  const navigate = useNavigate();
  const { geoData } = useApp();
  const sensors = geoData.sensors?.sensors || [];

  const conflicts = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < sensors.length; i++) {
      for (let j = i + 1; j < sensors.length; j++) {
        const s1 = sensors[i];
        const s2 = sensors[j];
        if (!s1.lat || !s2.lat) continue;
        const pt1 = turf.point([s1.lng, s1.lat]);
        const pt2 = turf.point([s2.lng, s2.lat]);
        const dist = turf.distance(pt1, pt2, { units: 'kilometers' });
        
        // Flag if within 15km and one is normal while other is alert/overflowing
        if (dist < 15) {
          const st1 = s1.status.toLowerCase();
          const st2 = s2.status.toLowerCase();
          const isConflict = 
            (st1 === 'normal' && (st2.includes('alert') || st2 === 'overflowing')) ||
            (st2 === 'normal' && (st1.includes('alert') || st1 === 'overflowing'));
            
          if (isConflict) {
            list.push({ s1, s2, distance: dist.toFixed(1) });
          }
        }
      }
    }
    return list;
  }, [sensors]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      {/* Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between items-start pointer-events-none">
        
        {/* Back Button & Title */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-slate-200 text-slate-700 hover:text-cyan-700 hover:border-cyan-300 transition-all text-sm font-bold w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              <h1 className="text-lg font-extrabold text-slate-900">Hydro Sensor Network</h1>
            </div>
            <p className="text-xs text-slate-600">
              Full-screen live geographic visualization of dam levels, reservoir gauges, and river stations with live condition indicators.
            </p>
          </div>

          {conflicts.length > 0 && (
            <div className="bg-rose-50 p-4 rounded-xl shadow-md border border-rose-200 max-w-sm">
              <div className="flex items-center gap-2 mb-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h1 className="text-sm font-extrabold">Conflicting Observations</h1>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {conflicts.map((c, i) => (
                  <div key={i} className="text-[10px] text-rose-900 leading-tight bg-white p-2 border border-rose-100 rounded">
                    <strong>{c.s1.name}</strong> ({c.s1.status}) and <strong>{c.s2.name}</strong> ({c.s2.status}) are only <strong>{c.distance}km</strong> apart.
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-rose-800 mt-2 font-semibold">
                Resolution Policy: Defaulting to higher-severity reading pending manual ground verification.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 pointer-events-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Status Legend</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Normal', status: 'Normal' },
              { label: 'Orange Alert', status: 'Orange Alert' },
              { label: 'Red Alert', status: 'Red Alert' },
              { label: 'Overflowing', status: 'Overflowing' }
            ].map((item) => {
              const { bg, isPulsing } = getStatusColor(item.status);
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    {isPulsing && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bg} opacity-75`}></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${bg}`}></span>
                  </div>
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full z-0">
        <MapContainer 
          center={[9.4, 76.8]} 
          zoom={9} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <MapResizer />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {sensors.map((sensor) => (
            sensor.lat && sensor.lng ? (
              <Marker 
                key={sensor.id} 
                position={[sensor.lat, sensor.lng]}
                icon={createCustomIcon(sensor.status)}
              >
                <Tooltip 
                  permanent 
                  direction="top" 
                  offset={[0, -14]}
                  className="sensor-label-tooltip bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-sans pointer-events-auto"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-slate-900 text-xs tracking-tight">{sensor.name}</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className={`font-mono font-bold ${sensor.capacity_percent > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {sensor.capacity_percent}%
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className={`font-bold ${getStatusColor(sensor.status).text}`}>
                        {sensor.status}
                      </span>
                    </div>
                  </div>
                </Tooltip>

                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-mono uppercase">{sensor.location}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-3">{sensor.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Capacity</span>
                        <span className={`font-mono font-bold ${sensor.capacity_percent > 100 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {sensor.capacity_percent}%
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Status</span>
                        <span className={`text-xs font-semibold ${getStatusColor(sensor.status).text}`}>
                          {sensor.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}

          <AutoFitBounds markers={sensors} />
        </MapContainer>
      </div>
    </div>
  );
}
