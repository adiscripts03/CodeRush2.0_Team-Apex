import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import MapView from '../components/MapView';
import LayerToggle from '../components/LayerToggle';
import DataGapBanner from '../components/DataGapBanner';
import { calculateImpactEstimate } from '../lib/impactEstimate';
import { useActivityLog } from '../lib/activityLogger';
import { Waves, Activity } from 'lucide-react';

export default function CommandMap() {
  const navigate = useNavigate();
  const { logEvent } = useActivityLog();
  const { currentKeyframe, geoData, focusedPlan, clearFocusedPlan } = useApp();

  const [layerVisibility, setLayerVisibility] = useState({
    hospitals: false,
    shelters: false,
    roads: false,
    rivers: false,
    flood: false,
  });

  const toggleLayer = (layerKey) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Data Gap Banner (if current keyframe has data_gap: true) */}
      <DataGapBanner currentKeyframe={currentKeyframe} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Main Map Container */}
        <main className="flex-1 relative flex flex-col">
          {/* Top Floating Layer Controls (hidden in focused mode) */}
          {!focusedPlan && (
            <div className="absolute top-4 left-4 z-10 max-w-xl space-y-3">
              <LayerToggle layerVisibility={layerVisibility} toggleLayer={toggleLayer} />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/sensor-map')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-xs font-bold text-slate-700 hover:text-cyan-700 hover:border-cyan-300 transition-all"
                >
                  <Waves className="w-4 h-4 text-cyan-600" />
                  <span>Hydro Map</span>
                </button>
                <button
                  onClick={() => navigate('/seismic')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-xs font-bold text-slate-700 hover:text-rose-700 hover:border-rose-300 transition-all"
                >
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span>Seismic Map</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Map */}
          <div className="flex-1 w-full h-full">
            <MapView
              geoData={geoData}
              layerVisibility={layerVisibility}
              focusedPlan={focusedPlan}
              onExitFocusedView={clearFocusedPlan}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
