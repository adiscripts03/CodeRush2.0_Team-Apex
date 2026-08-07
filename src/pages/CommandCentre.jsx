import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { useActivityLog } from '../lib/activityLogger';
import MapView from '../components/MapView';
import ActivityFeedItem from '../components/ActivityFeedItem';
import ConfidenceBadge from '../components/ConfidenceBadge';
import { calculateImpactEstimate } from '../lib/impactEstimate';
import {
  MapPin,
  ClipboardCheck,
  Bell,
  Activity,
  Waves,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CommandCentre() {
  const navigate = useNavigate();
  const { logs } = useActivityLog();
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

        {/* Banner Disclaimer */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900">Kerala Floods (August 2018) Historical Command System</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                  REPLAY MODE
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Disaster simulation & decision support platform using real Dartmouth Flood Observatory satellite polygons and OSM infrastructure datasets.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <ConfidenceBadge confidence={currentKeyframe?.confidence} source={currentKeyframe?.source} />
          </div>
        </div>

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

        {/* Dashboard Main Grid: Embedded Map Preview & Right Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Map Preview Widget */}
          <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Spatial Hazard Overview</h3>
              </div>
              <button
                onClick={() => navigate('/map')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
              >
                <span>Launch Full Screen Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200">
              <MapView geoData={geoData} layerVisibility={layerVisibility} />
            </div>
          </div>

          {/* Hydro Sensor Feed & Recent Activity Stream */}
          <div className="lg:col-span-5 space-y-6">

            {/* Hydro Sensor Gauge Feeds */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Hydro Sensor & Reservoir Feed</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/sensor-map')}
                    className="text-[10px] font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 uppercase tracking-wider"
                  >
                    <span>View on Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">SYNTHETIC FEED</span>
                </div>
              </div>

              <div className="space-y-2">
                {geoData.sensors?.sensors?.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{sensor.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">{sensor.location}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${sensor.capacity_percent > 100 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {sensor.capacity_percent}%
                      </span>
                      <span className="block text-[10px] text-slate-500 font-semibold">{sensor.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Log Stream */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Activity Log</h3>
                <button
                  onClick={() => navigate('/activity')}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800"
                >
                  View All ({logs.length})
                </button>
              </div>

              <div className="space-y-2">
                {logs.slice(0, 4).map((log) => (
                  <ActivityFeedItem key={log.id} log={log} />
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
