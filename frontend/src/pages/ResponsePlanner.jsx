import React, { useMemo } from 'react';
import { useApp } from '../state/AppContext';
import PlanCard from '../components/PlanCard';
import { generateEvacuationPlan } from '../lib/planGenerator';
import { calculateImpactEstimate } from '../lib/impactEstimate';
import { useActivityLog } from '../lib/activityLogger';
import { ClipboardCheck, RefreshCw, CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ResponsePlanner() {
  const { logEvent } = useActivityLog();
  const {
    geoData,
    recommendedActions,
    setRecommendedActions,
    actionStates,
    updateActionStatus,
  } = useApp();

  // Spatial impact calculate
  const impact = useMemo(() => {
    return calculateImpactEstimate({
      floodPolygon: geoData.floodPolygon,
      hospitals: geoData.hospitals,
      shelters: geoData.shelters,
      roads: geoData.roads,
    });
  }, [geoData]);

  // Regenerate plan logic
  const handleRegenerate = () => {
    const plans = generateEvacuationPlan({
      atRiskHospitals: impact.atRiskHospitals,
      atRiskShelters: impact.atRiskShelters,
      safeShelters: impact.safeShelters,
      shelterCapacities: geoData.shelterCapacities,
    });

    setRecommendedActions(plans);

    logEvent({
      type: 'plan',
      message: `Regenerated ${plans.length} rule-based evacuation recommendations based on updated hazard coordinates.`,
      timestamp: new Date().toISOString(),
    });
  };

  const pendingCount = recommendedActions.filter(
    a => !actionStates[a.id] || actionStates[a.id].status === 'pending'
  ).length;

  const approvedCount = recommendedActions.filter(
    a => actionStates[a.id]?.status === 'approved'
  ).length;

  const rejectedCount = recommendedActions.filter(
    a => actionStates[a.id]?.status === 'rejected'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Response Action Planner</h1>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  Human-in-the-Loop Required
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Rule-based evacuation and allocation recommendations generated from current satellite spatial overlays.
              </p>
            </div>
          </div>

          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-Generate Action Recommendations</span>
          </button>
        </div>

        {/* Action Status Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase block">Total Generated</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{recommendedActions.length}</span>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase">Pending Review</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-extrabold text-amber-800 font-mono">{pendingCount}</span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Confirmed & Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-extrabold text-emerald-800 font-mono">{approvedCount}</span>
          </div>

          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase">Rejected Actions</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-2xl font-extrabold text-rose-800 font-mono">{rejectedCount}</span>
          </div>
        </div>

        {/* Human-in-the-loop Guardrail Callout */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            <strong>Operational Policy:</strong> All AI and rule-generated recommendations remain strictly draft directives until explicitly reviewed and approved by a human officer. Unapproved recommendations will never dispatch operational units.
          </span>
        </div>

        {/* Recommended Action Cards List */}
        {recommendedActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedActions.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                actionState={actionStates[plan.id] || {}}
                onUpdateStatus={updateActionStatus}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <ClipboardCheck className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Action Plans Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click "Re-Generate Action Recommendations" above or navigate to the Command Map to analyze spatial intersections.
            </p>
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700"
            >
              Generate Recommendations Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
