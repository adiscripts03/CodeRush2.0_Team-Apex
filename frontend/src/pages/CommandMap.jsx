import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import MapView from '../components/MapView';
import LayerToggle from '../components/LayerToggle';
import DataGapBanner from '../components/DataGapBanner';
import { calculateImpactEstimate } from '../lib/impactEstimate';
import { useActivityLog } from '../lib/activityLogger';

export default function CommandMap() {
  const navigate = useNavigate();
  const { logEvent } = useActivityLog();
  const {
    currentKeyframe,
    layerVisibility,
    toggleLayer,
    geoData,
    focusedPlan,
    clearFocusedPlan,
  } = useApp();

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Data Gap Banner (if current keyframe has data_gap: true) */}
      <DataGapBanner currentKeyframe={currentKeyframe} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Main Map Container */}
        <main className="flex-1 relative flex flex-col">
          {/* Top Floating Layer Controls (hidden in focused mode) */}
          {!focusedPlan && (
            <div className="absolute top-4 left-4 z-10 max-w-xl">
              <LayerToggle layerVisibility={layerVisibility} toggleLayer={toggleLayer} />
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
