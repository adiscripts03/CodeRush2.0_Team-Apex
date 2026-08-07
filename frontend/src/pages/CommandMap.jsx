import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import MapView from '../components/MapView';
import TimelineScrubber from '../components/TimelineScrubber';
import LayerToggle from '../components/LayerToggle';
import DataGapBanner from '../components/DataGapBanner';
import { calculateImpactEstimate } from '../lib/impactEstimate';
import { generateEvacuationPlan } from '../lib/planGenerator';
import { useActivityLog } from '../lib/activityLogger';
import { Building2, Home, Waves, ArrowRight, Zap } from 'lucide-react';

export default function CommandMap() {
  const navigate = useNavigate();
  const { logEvent } = useActivityLog();
  const {
    timelineData,
    currentKeyframeIndex,
    currentKeyframe,
    setKeyframeIndex,
    isPlayingTimeline,
    setIsPlayingTimeline,
    layerVisibility,
    toggleLayer,
    geoData,
    setRecommendedActions,
  } = useApp();

  // Perform Turf.js spatial impact calculations
  const impact = useMemo(() => {
    return calculateImpactEstimate({
      floodPolygon: geoData.floodPolygon,
      hospitals: geoData.hospitals,
      shelters: geoData.shelters,
      roads: geoData.roads,
    });
  }, [geoData]);

  // Handle plan generation action
  const handleGeneratePlan = () => {
    const plans = generateEvacuationPlan({
      atRiskHospitals: impact.atRiskHospitals,
      atRiskShelters: impact.atRiskShelters,
      safeShelters: impact.safeShelters,
      shelterCapacities: geoData.shelterCapacities,
    });

    setRecommendedActions(plans);

    logEvent({
      type: 'plan',
      message: `Generated ${plans.length} recommended response actions based on current spatial hazard overlay.`,
      timestamp: new Date().toISOString(),
    });

    navigate('/planner');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Data Gap Banner (if current keyframe has data_gap: true) */}
      <DataGapBanner currentKeyframe={currentKeyframe} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Impact Estimation Stats Panel */}
        <aside className="w-80 lg:w-96 bg-white border-r border-slate-200 p-4 flex flex-col overflow-y-auto shrink-0 z-10 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Hazard Impact Analysis</h2>
              <p className="text-[11px] text-slate-500 font-mono">Turf.js Real-time Geospatial Intersection</p>
            </div>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Waves className="w-4 h-4" />
            </span>
          </div>

          {/* Metric Summary Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Flooded Area</span>
              <span className="text-xl font-extrabold text-blue-700 font-mono">
                {impact.floodedAreaHectares.toLocaleString()} <span className="text-xs font-sans text-slate-500">ha</span>
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Roads Affected</span>
              <span className="text-xl font-extrabold text-amber-700 font-mono">
                {impact.affectedRoadsKm} <span className="text-xs font-sans text-slate-500">km</span>
              </span>
            </div>
          </div>

          {/* At-Risk Hospitals List */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <Building2 className="w-4 h-4" />
                <span>At-Risk Hospitals</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-bold text-xs border border-rose-200">
                {impact.atRiskHospitals.length}
              </span>
            </div>
            {impact.atRiskHospitals.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {impact.atRiskHospitals.slice(0, 6).map((h, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-white border border-rose-200 text-slate-800 shadow-sm">
                    <p className="font-bold text-rose-700 truncate">{h.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">District: {h.properties?.['addr:district'] || 'Alappuzha'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No hospitals inside immediate hazard boundary.</p>
            )}
          </div>

          {/* At-Risk Shelters List */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                <Home className="w-4 h-4" />
                <span>At-Risk Facilities</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold text-xs border border-amber-200">
                {impact.atRiskShelters.length}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Safe Available Relief Centres: <strong className="text-emerald-700 font-mono">{impact.safeShelters.length}</strong>
            </p>
          </div>

          {/* Generate Plan Button */}
          <div className="mt-auto pt-2">
            <button
              onClick={handleGeneratePlan}
              className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Generate Response Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Center Main Map Container */}
        <main className="flex-1 relative flex flex-col">
          {/* Top Floating Layer Controls */}
          <div className="absolute top-4 left-4 z-10 max-w-xl">
            <LayerToggle layerVisibility={layerVisibility} toggleLayer={toggleLayer} />
          </div>

          {/* Interactive Map */}
          <div className="flex-1 w-full h-full">
            <MapView
              geoData={geoData}
              layerVisibility={layerVisibility}
            />
          </div>
        </main>
      </div>

      {/* Bottom Timeline Scrubber */}
      <TimelineScrubber
        timelineData={timelineData}
        currentKeyframeIndex={currentKeyframeIndex}
        setKeyframeIndex={setKeyframeIndex}
        isPlayingTimeline={isPlayingTimeline}
        setIsPlayingTimeline={setIsPlayingTimeline}
      />
    </div>
  );
}
