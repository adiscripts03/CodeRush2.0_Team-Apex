import React, { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import PlanCard from '../components/PlanCard';
import { generateFullEvacuationPlan, generateAgenticPlan } from '../lib/planGenerator';
import { calculateImpactEstimate } from '../lib/impactEstimate';
import { useActivityLog } from '../lib/activityLogger';
import { ClipboardCheck, RefreshCw, CheckCircle2, XCircle, AlertCircle, ShieldAlert, Brain, Zap, Loader2 } from 'lucide-react';

export default function ResponsePlanner() {
  const { logEvent } = useActivityLog();
  const {
    geoData,
    recommendedActions,
    setRecommendedActions,
    actionStates,
    updateActionStatus,
  } = useApp();

  const [planSource, setPlanSource] = useState(null); // 'rule-based' | 'llm' | 'mock' | 'fallback'
  const [isAgenticLoading, setIsAgenticLoading] = useState(false);

  // Spatial impact calculate
  const impact = useMemo(() => {
    return calculateImpactEstimate({
      floodPolygon: geoData.floodPolygon,
      hospitals: geoData.hospitals,
      shelters: geoData.shelters,
      roads: geoData.roads,
    });
  }, [geoData]);

  // Rule-based regenerate plan (now uses generateFullEvacuationPlan for enriched data)
  const handleRegenerate = async () => {
    setIsAgenticLoading(true); // Re-use the loading state so UI shows a spinner
    try {
      const { fullPlans } = await generateFullEvacuationPlan({
        atRiskHospitals: impact.atRiskHospitals,
        atRiskShelters: impact.atRiskShelters,
        safeShelters: impact.safeShelters,
        shelterCapacities: geoData.shelterCapacities,
      });

      setRecommendedActions(fullPlans);
      setPlanSource('rule-based');

      logEvent({
        type: 'plan',
        message: `Generated full evacuation plan: ${fullPlans.length} recommendations with ${fullPlans.filter(p => p.assignedShelters?.length).length} shelters assigned, ${fullPlans.filter(p => p.assignedHospitals?.length).length} hospitals identified.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Rule-based plan generation error:', err);
    } finally {
      setIsAgenticLoading(false);
    }
  };

  // Agentic plan with LLM reasoning
  const handleAgenticPlan = async () => {
    setIsAgenticLoading(true);
    try {
      const result = await generateAgenticPlan({
        atRiskHospitals: impact.atRiskHospitals,
        atRiskShelters: impact.atRiskShelters,
        safeShelters: impact.safeShelters,
        shelterCapacities: geoData.shelterCapacities,
      });

      setRecommendedActions(result.plans);
      setPlanSource(result.source);

      logEvent({
        type: 'plan',
        message: `Agentic plan generated (${result.source}): ${result.plans.length} recommendations with reasoning traces.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Agentic plan error:', err);
    } finally {
      setIsAgenticLoading(false);
    }
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

  const sourceBadge = {
    'llm': { label: 'LLM Agentic (OpenAI)', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    'mock': { label: 'Agentic (Simulated Reasoning)', cls: 'bg-violet-100 text-violet-800 border-violet-300' },
    'fallback': { label: 'Rule-Based (Fallback)', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
    'rule-based': { label: 'Rule-Based', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  };

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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">Response Action Planner</h1>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  Human-in-the-Loop Required
                </span>
                {planSource && sourceBadge[planSource] && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${sourceBadge[planSource].cls}`}>
                    {sourceBadge[planSource].label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Rule-based or AI-agentic evacuation recommendations from current satellite spatial overlays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Rule-based regenerate */}
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Rule-Based Plan</span>
            </button>

            {/* Agentic plan with LLM reasoning */}
            <button
              onClick={handleAgenticPlan}
              disabled={isAgenticLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-bold text-xs transition-colors disabled:opacity-60"
            >
              {isAgenticLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span>{isAgenticLoading ? 'Thinking...' : 'Agentic Plan (AI)'}</span>
              {!isAgenticLoading && <Zap className="w-3.5 h-3.5 opacity-70" />}
            </button>
          </div>
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
              Use <strong>Rule-Based Plan</strong> for deterministic recommendations, or <strong>Agentic Plan (AI)</strong> for LLM-reasoned decisions with natural-language justifications.
            </p>
            <div className="flex items-center gap-2 justify-center flex-wrap pt-2">
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300"
              >
                Rule-Based Plan
              </button>
              <button
                onClick={handleAgenticPlan}
                disabled={isAgenticLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60"
              >
                <Brain className="w-3.5 h-3.5" />
                {isAgenticLoading ? 'Thinking...' : 'Agentic Plan (AI)'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
