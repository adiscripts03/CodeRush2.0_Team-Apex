import React, { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext';
import { evaluatePostEvent } from '../lib/evaluation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, ShieldAlert, CheckCircle, AlertOctagon, TrendingUp, ShieldCheck } from 'lucide-react';

export default function EvaluationReport() {
  const { timelineData } = useApp();
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function runEvaluation() {
      if (!timelineData) return;
      
      try {
        // Fetch ground truth (peak flood)
        const peakRes = await fetch('/data/flood_20180817.geojson');
        const groundTruth = await peakRes.json();

        // Fetch all distinct polygon files from timeline to build the map
        const predictedGeojsonMap = {};
        const uniqueFiles = [...new Set(timelineData.keyframes.map(kf => kf.hazard_polygon_file))];
        
        for (const file of uniqueFiles) {
          const res = await fetch(`/data/${file}`);
          predictedGeojsonMap[file] = await res.json();
        }

        const results = evaluatePostEvent(timelineData, groundTruth, predictedGeojsonMap);
        setEvaluationResults(results);
      } catch (err) {
        console.error('Failed to run evaluation:', err);
      } finally {
        setIsLoading(false);
      }
    }

    runEvaluation();
  }, [timelineData]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500 animate-pulse font-bold text-sm">Running Post-Event Retrospective Analysis...</div>
      </div>
    );
  }

  if (!evaluationResults) return null;

  // Prepare chart data
  const chartData = evaluationResults.iouScores.map(score => ({
    time: score.label.split(' ')[0], // just the date
    IoU: parseFloat((score.iou * 100).toFixed(1)),
    Confidence: parseFloat((score.confidence * 100).toFixed(1))
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Post-Event Retrospective & Evaluation</h1>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                Analysis of predictive accuracy, operational feasibility, and calibration against the August 17 ground-truth peak event.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            No Auto-Tuning Applied
          </div>
        </div>

        {/* Operational Disclaimer */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 shadow-sm">
          <Activity className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong>System Notification:</strong> This evaluation report runs purely post-event. It highlights deltas and performance metrics for human review. Per strict operational policy, the command system <strong>does not silently auto-tune thresholds or confidence scores</strong> based on these metrics. Any adjustments to live models require manual commander approval.
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mean Spatial IoU</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{(evaluationResults.averageIoU * 100).toFixed(1)}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Overlap between predicted footprints and final ground truth.</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Detection Lead Time</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{evaluationResults.detectionLeadTimeHours}</span>
              <span className="text-xs font-bold text-slate-500">hours</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Hours before peak event that confidence crossed >80% threshold.</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">False Alarm Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600 font-mono">{(evaluationResults.falseAlarmRate * 100).toFixed(1)}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">High confidence (>80%) predictions with low actual IoU (&lt;30%).</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Resource Feasibility</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">{(evaluationResults.resourceFeasibility * 100).toFixed(0)}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Percentage of AI-generated response plans structurally executable in reality.</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Spatial Accuracy vs Confidence Trend */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Predicted Extent IoU vs System Confidence
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                  <Line yAxisId="left" type="monotone" dataKey="IoU" name="Spatial IoU %" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="left" type="monotone" dataKey="Confidence" name="Sys Confidence %" stroke="#0ea5e9" strokeWidth={3} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Calibration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Confidence Calibration Reliability
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evaluationResults.calibration} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                  <RechartsTooltip 
                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Average IoU']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="avgIoU" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Measures if higher declared confidence actually yielded higher spatial accuracy (IoU).
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
