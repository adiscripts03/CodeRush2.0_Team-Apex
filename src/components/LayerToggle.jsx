import React from 'react';
import { Building2, Home, Compass, Waves, Layers } from 'lucide-react';

export default function LayerToggle({ layerVisibility, toggleLayer }) {
  const layers = [
    { key: 'flood', label: 'Flood Extents', icon: Waves, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { key: 'hospitals', label: 'Hospitals', icon: Building2, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { key: 'shelters', label: 'Relief Shelters', icon: Home, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { key: 'roads', label: 'Road Network', icon: Compass, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'rivers', label: 'Rivers', icon: Waves, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-200">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
        <Layers className="w-4 h-4 text-cyan-600" />
        <span>Map Overlay Controls</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {layers.map(layer => {
          const Icon = layer.icon;
          const isActive = layerVisibility[layer.key];
          return (
            <button
              key={layer.key}
              onClick={() => toggleLayer(layer.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                isActive
                  ? `${layer.color} shadow-sm font-bold`
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{layer.label}</span>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-current' : 'bg-slate-300'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
