import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import MapView from '../components/MapView';
import { calculateImpactEstimate } from '../lib/impactEstimate';
import {
  MapPin,
  ClipboardCheck,
  Bell,
  Waves,
  Building2,
  ArrowRight,
} from 'lucide-react';

export default function CommandCentre() {
  const navigate = useNavigate();
  const {
    geoData,
    currentKeyframe,
    layerVisibility,
    recommendedActions,
    actionStates,
    sentAlerts,
  } = useApp();

  // Spatial metrics
  const impact = useMemo(() => {
    return calculateImpactEstimate({
      floodPolygon: geoData.floodPolygon,
      hospitals: geoData.hospitals,
      shelters: geoData.shelters,
      roads: geoData.roads,
    });
  }, [geoData]);

  const pendingCount = recommendedActions.filter(
    (a) => !actionStates[a.id] || actionStates[a.id].status === 'pending'
  ).length;

  const approvedCount = recommendedActions.filter(
    (a) => actionStates[a.id]?.status === 'approved'
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">


        {/* Metric Summary Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div
            onClick={() => navigate('/map')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-cyan-400 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flooded Extent</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <Waves className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-blue-700 font-mono">
              {impact.floodedAreaHectares.toLocaleString()} <span className="text-sm text-slate-500 font-sans">ha</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between font-medium">
              <span>{impact.affectedRoadsKm} km roads submerged</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            </p>
          </div>

          <div
            onClick={() => navigate('/map')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-400 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">At-Risk Facilities</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-rose-600 font-mono">
              {impact.atRiskHospitals.length + impact.atRiskShelters.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between font-medium">
              <span>{impact.atRiskHospitals.length} Hospitals, {impact.atRiskShelters.length} Shelters</span>
              <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
            </p>
          </div>

          <div
            onClick={() => navigate('/planner')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 font-mono">
              {pendingCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between font-medium">
              <span>{approvedCount} Confirmed & Approved</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
            </p>
          </div>

          <div
            onClick={() => navigate('/alerts')}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alerts Dispatched</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-700 font-mono">
              {sentAlerts.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between font-medium">
              <span>Transactional Email Feed</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
            </p>
          </div>

        </div>

        {/* Dashboard Full Width Spatial Hazard Overview Map */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900">Live Spatial Hazard Overview</h3>
            </div>
            <button
              onClick={() => navigate('/map')}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1.5 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-xl transition-all"
            >
              <span>Launch Full Screen Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full h-[540px] rounded-xl overflow-hidden border border-slate-200">
            <MapView geoData={geoData} layerVisibility={layerVisibility} />
          </div>
        </div>

      </div>
    </div>
  );
}
