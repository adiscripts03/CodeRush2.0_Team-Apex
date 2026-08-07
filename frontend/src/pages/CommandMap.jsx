import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import MapView from '../components/MapView';
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
    </div>
  );
}
