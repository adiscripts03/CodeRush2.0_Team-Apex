import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, ClipboardCheck, History, Bell, Activity } from 'lucide-react';
import { useApp } from '../state/AppContext';

export default function Navbar() {
  const { currentKeyframe, recommendedActions, actionStates, sentAlerts } = useApp();

  const pendingCount = recommendedActions.filter(
    (a) => !actionStates[a.id] || actionStates[a.id].status === 'pending'
  ).length;

  const navItems = [
    { path: '/', label: 'Command Dashboard', icon: LayoutDashboard },
    { path: '/map', label: 'Command Map', icon: MapPin },
    {
      path: '/planner',
      label: 'Response Planner',
      icon: ClipboardCheck,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { path: '/activity', label: 'Activity Log', icon: History },
    {
      path: '/alerts',
      label: 'Alert Centre',
      icon: Bell,
      badge: sentAlerts.length > 0 ? sentAlerts.length : null,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center shadow-md shadow-cyan-600/20 text-white">
            <Activity className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight">
                Disaster Command <span className="text-cyan-600 font-mono">v1.0</span>
              </h1>
              <span className="bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Kerala 2018 Replay
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Historical Simulation & Decision Support</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 bg-amber-500 text-white font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Current Simulation Indicator */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono text-slate-700 font-medium">
            {currentKeyframe?.label || 'Aug 2018 Event'}
          </span>
        </div>

      </div>
    </header>
  );
}
