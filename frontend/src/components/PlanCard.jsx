import React, { useState } from 'react';
import { CheckCircle2, XCircle, Edit3, ShieldAlert } from 'lucide-react';

export default function PlanCard({ plan, actionState = {}, onUpdateStatus }) {
  const [isEditing, setIsEditing] = useState(false);
  const [customNote, setCustomNote] = useState(actionState.notes || '');

  const status = actionState.status || 'pending'; // 'pending' | 'approved' | 'rejected'

  const handleApprove = () => {
    onUpdateStatus(plan.id, 'approved', customNote);
  };

  const handleReject = () => {
    onUpdateStatus(plan.id, 'rejected', customNote);
  };

  const handleSaveEdit = () => {
    onUpdateStatus(plan.id, status, customNote);
    setIsEditing(false);
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-300 shadow-md ${
        status === 'approved'
          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
          : status === 'rejected'
          ? 'bg-rose-50/60 border-rose-200 opacity-75'
          : 'bg-white border-amber-300 ring-1 ring-amber-300/40'
      }`}
    >
      {/* Header Badge: Recommendation vs Approved Action */}
      <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-slate-100 text-slate-800 border border-slate-200">
            {plan.priority}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            {plan.type}
          </span>
        </div>

        {/* Status Indicator Badge */}
        {status === 'pending' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>PENDING HUMAN APPROVAL</span>
          </div>
        )}
        {status === 'approved' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONFIRMED & APPROVED</span>
          </div>
        )}
        {status === 'rejected' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>REJECTED / DISCARDED</span>
          </div>
        )}
      </div>

      {/* Action Title & Description */}
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{plan.title}</h3>
      <p className="text-xs text-slate-700 leading-relaxed mb-3">{plan.description}</p>

      {/* Agentic Reasoning Trace (shown when LLM or mock agentic plan is used) */}
      {plan.reasoning && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 leading-relaxed">
          <span className="font-bold text-indigo-700 block mb-1">🤖 AI Reasoning:</span>
          {plan.reasoning}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Origin</span>
          <span className="font-bold text-slate-800 truncate block">{plan.sourceLocation}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Destination</span>
          <span className="font-bold text-emerald-700 truncate block">{plan.targetShelterName}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Distance</span>
          <span className="font-bold text-cyan-700 block">{plan.distanceKm} km</span>
        </div>
      </div>

      {/* Custom Editable Notes */}
      {isEditing ? (
        <div className="mb-4 space-y-2">
          <label className="text-xs font-semibold text-slate-700">Edit Operational Note / Directives:</label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            rows={2}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
            placeholder="Add operational notes or modifications..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 rounded text-xs bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-2.5 py-1 rounded text-xs bg-cyan-600 text-white font-bold hover:bg-cyan-700"
            >
              Save Note
            </button>
          </div>
        </div>
      ) : customNote ? (
        <div className="mb-4 p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between">
          <span><strong className="text-slate-700">Commander Note:</strong> {customNote}</span>
          <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-cyan-700">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* Decision Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Directives</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReject}
            disabled={status === 'rejected'}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              status === 'rejected'
                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={status === 'approved'}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              status === 'approved'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{status === 'approved' ? 'Approved & Confirmed' : 'Approve Action'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
