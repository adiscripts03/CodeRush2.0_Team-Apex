import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ConfidenceBadge({ confidence = 0.9, source = 'confirmed' }) {
  let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let Icon = ShieldCheck;
  let labelText = 'High Confidence (Satellite Direct)';

  if (confidence < 0.5 || source === 'interpolated') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
    Icon = AlertTriangle;
    labelText = 'Reduced Confidence (Model Interpolated)';
  }

  if (confidence < 0.4) {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300';
    Icon = ShieldAlert;
    labelText = 'Low Confidence Data';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide shadow-sm ${badgeStyle}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{labelText} — {(confidence * 100).toFixed(0)}%</span>
    </div>
  );
}
