import React from 'react';
import { AlertCircle, EyeOff } from 'lucide-react';

export default function DataGapBanner({ currentKeyframe }) {
  if (!currentKeyframe || !currentKeyframe.data_gap) {
    return null;
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-300 text-amber-900 px-4 py-2.5 flex items-center justify-between shadow-sm animate-pulse">
      <div className="flex items-center gap-3 max-w-4xl">
        <div className="p-1.5 rounded-lg bg-amber-200 text-amber-800">
          <EyeOff className="w-5 h-5 shrink-0" />
        </div>
        <div>
          <span className="font-bold text-amber-900 mr-2 uppercase text-xs tracking-wider border border-amber-400 bg-amber-200/60 px-1.5 py-0.5 rounded">
            Data Gap Window Detected
          </span>
          <span className="text-sm font-semibold text-amber-950">
            {currentKeyframe.note || "No satellite observation in this window — showing last-confirmed extent with reduced confidence."}
          </span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs font-mono font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Confidence: {(currentKeyframe.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
