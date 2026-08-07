import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../state/AppContext';
import { ArrowLeft, Activity, ShieldAlert, Zap, Filter, MapPin, AlertTriangle, Gauge, Layers } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

// Helper component for Leaflet size invalidation
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

// Helper component to pan/zoom map to selected event
function MapController({ selectedCoords }) {
  const map = useMap();
  useEffect(() => {
    if (selectedCoords) {
      map.flyTo(selectedCoords, 11, { duration: 1.5 });
    }
  }, [map, selectedCoords]);
  return null;
}

// Auto-fit bounds
function AutoFitBounds({ events }) {
  const map = useMap();
  useEffect(() => {
    if (events && events.length > 0) {
      const valid = events.filter(e => e.lat && e.lng);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map(e => [e.lat, e.lng]));
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    }
  }, [map, events]);
  return null;
}

// Magnitude color styling helper
const getMagnitudeStyle = (mag) => {
  if (mag >= 6.0) {
    return {
      bg: 'bg-rose-600',
      text: 'text-rose-600',
      border: 'border-rose-700',
      fillColor: '#e11d48',
      radius: mag * 4000,
      label: 'Major Event',
      badge: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  } else if (mag >= 5.0) {
    return {
      bg: 'bg-orange-500',
      text: 'text-orange-600',
      border: 'border-orange-600',
      fillColor: '#f97316',
      radius: mag * 3200,
      label: 'Strong Tremor',
      badge: 'bg-orange-100 text-orange-800 border-orange-300'
    };
  } else if (mag >= 4.0) {
    return {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      border: 'border-amber-600',
      fillColor: '#f59e0b',
      radius: mag * 2500,
      label: 'Moderate',
      badge: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  } else {
    return {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
      border: 'border-emerald-600',
      fillColor: '#10b981',
      radius: mag * 2000,
      label: 'Minor',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  }
};

const createSeismicMarkerIcon = (mag) => {
  const style = getMagnitudeStyle(mag);
  const isPulsing = mag >= 5.0;
  const pulseHtml = isPulsing 
    ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full ${style.bg} opacity-75"></span>` 
    : '';

  const html = `
    <div class="relative flex h-7 w-7 items-center justify-center">
      ${pulseHtml}
      <span class="relative inline-flex items-center justify-center rounded-full h-6 w-6 ${style.bg} text-white font-mono text-[10px] font-extrabold border-2 border-white shadow-lg">
        ${mag.toFixed(1)}
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-seismic-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export default function SeismicMap() {
  const navigate = useNavigate();
  const { geoData } = useApp();
  
  const seismicData = geoData.seismic || {
    summary: { total_events: 0, max_magnitude: 0, hazard_level: 'Monitoring' },
    fault_lines: null,
    events: []
  };

  const [minMagFilter, setMinMagFilter] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFaultLines, setShowFaultLines] = useState(true);

  // Filtered seismic events
  const filteredEvents = useMemo(() => {
    return (seismicData.events || []).filter(e => e.magnitude >= minMagFilter);
  }, [seismicData.events, minMagFilter]);

  const maxMag = useMemo(() => {
    if (!seismicData.events || seismicData.events.length === 0) return 0;
    return Math.max(...seismicData.events.map(e => e.magnitude));
  }, [seismicData.events]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden relative font-sans">
      
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-none">
        
        {/* Left Title Block */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-700 text-slate-200 hover:text-white transition-all text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white tracking-wide">Seismic Hazard & Telemetry Network</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  REAL-TIME FEEDS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Seismograph telemetric epicenters & fault line stress vectors</p>
            </div>
          </div>
        </div>

        {/* Right KPI Metrics & Filter Control */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <div className="bg-slate-800/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Max Magnitude</span>
              <span className="font-mono font-extrabold text-rose-400">M {maxMag}</span>
            </div>
          </div>

          <div className="bg-slate-800/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-2 text-xs">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Events Tracked</span>
              <span className="font-mono font-extrabold text-cyan-400">{filteredEvents.length}</span>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={minMagFilter}
              onChange={(e) => setMinMagFilter(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-slate-800 text-slate-200">All Magnitudes</option>
              <option value={4.0} className="bg-slate-800 text-slate-200">M 4.0+</option>
              <option value={5.0} className="bg-slate-800 text-slate-200">M 5.0+</option>
              <option value={6.0} className="bg-slate-800 text-slate-200">M 6.0+ (Major)</option>
            </select>
          </div>

          {/* Toggle Fault Lines */}
          <button
            onClick={() => setShowFaultLines(!showFaultLines)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              showFaultLines
                ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/90 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fault Lines</span>
          </button>
        </div>

      </div>

      {/* Main Container: Map + Event Feed Sidebar */}
      <div className="flex-1 w-full h-full relative z-0 flex">

        {/* Map Container */}
        <div className="flex-1 h-full relative">
          <MapContainer
            center={[9.55, 76.65]}
            zoom={9}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <MapResizer />
            {selectedEvent && <MapController selectedCoords={[selectedEvent.lat, selectedEvent.lng]} />}

            {/* Dark CartoDB Map Layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
            />

            {/* Fault Lines Vector Layer */}
            {showFaultLines && seismicData.fault_lines && (
              <GeoJSON
                key="fault-lines-layer"
                data={seismicData.fault_lines}
                style={{
                  color: '#f59e0b',
                  weight: 2.5,
                  dashArray: '6, 6',
                  opacity: 0.8,
                }}
              />
            )}

            {/* Seismic Shaking Radius Circles */}
            {filteredEvents.map((evt) => {
              const style = getMagnitudeStyle(evt.magnitude);
              return (
                <Circle
                  key={`circle-${evt.id}`}
                  center={[evt.lat, evt.lng]}
                  radius={style.radius}
                  pathOptions={{
                    color: style.fillColor,
                    fillColor: style.fillColor,
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />
              );
            })}

            {/* Seismic Event Markers & Permanent Labels */}
            {filteredEvents.map((evt) => {
              const style = getMagnitudeStyle(evt.magnitude);
              return (
                <Marker
                  key={`marker-${evt.id}`}
                  position={[evt.lat, evt.lng]}
                  icon={createSeismicMarkerIcon(evt.magnitude)}
                  eventHandlers={{
                    click: () => setSelectedEvent(evt),
                  }}
                >
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -16]}
                    className="seismic-tooltip bg-slate-900/90 text-white px-2.5 py-1 rounded-lg border border-slate-700 shadow-xl font-sans text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-extrabold ${style.text}`}>M {evt.magnitude}</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-bold text-slate-200 text-[11px] truncate max-w-[130px]">{evt.place}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Depth: {evt.depth_km} km</span>
                    </div>
                  </Tooltip>

                  <Popup className="custom-dark-popup">
                    <div className="p-1 min-w-[220px] text-slate-900 font-sans">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                        <div className="flex items-center gap-1.5 font-extrabold text-sm text-rose-600">
                          <Zap className="w-4 h-4" />
                          <span>Magnitude {evt.magnitude}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-xs mb-1">{evt.place}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mb-3">{new Date(evt.timestamp).toLocaleString()}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
                        <div className="bg-slate-100 p-1.5 rounded">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">Hypocenter</span>
                          <span className="font-bold text-slate-800">{evt.depth_km} km</span>
                        </div>
                        <div className="bg-slate-100 p-1.5 rounded">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">PGA</span>
                          <span className="font-bold text-slate-800">{evt.pga_g} g</span>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-[11px] text-amber-900">
                        <span className="font-bold block mb-0.5">Evacuation Directive:</span>
                        {evt.advisory}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            <AutoFitBounds events={filteredEvents} />
          </MapContainer>
        </div>

        {/* Right Event Feed Drawer */}
        <div className="w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 p-4 flex flex-col justify-between z-[400] shadow-2xl">
          <div className="space-y-4 overflow-hidden flex flex-col flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Recent Epicenters</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{filteredEvents.length} events</span>
            </div>

            {/* Scrollable Event Cards */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {filteredEvents.map((evt) => {
                const style = getMagnitudeStyle(evt.magnitude);
                const isSelected = selectedEvent?.id === evt.id;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold ${style.badge}`}>
                        M {evt.magnitude}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-100 mb-1">{evt.place}</h4>
                    
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Depth: {evt.depth_km} km</span>
                      <span className={style.text}>{evt.intensity_mmi}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Alert Banner */}
          <div className="pt-3 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Seismic Safety Protocol</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug">
                Automatic trigger configured for M5.5+ tremors. Infrastructure strain sensors alerted.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
