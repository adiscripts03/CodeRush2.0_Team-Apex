import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, ClipboardCheck, History, Bell, Activity, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../state/AppContext';

export default function Navbar() {
  const { currentKeyframe, recommendedActions, actionStates, sentAlerts, isSidebarExpanded, toggleSidebar } = useApp();

  const pendingCount = recommendedActions.filter(
    (a) => !actionStates[a.id] || actionStates[a.id].status === 'pending'
  ).length;

  const navItems = [
    { path: '/', label: 'Command Dashboard', icon: LayoutDashboard },
    { path: '/map', label: 'Command Map', icon: MapPin },
    { path: '/sensor-map', label: 'Hydro Feed', icon: Activity },
    { path: '/seismic', label: 'Seismic Map', icon: Zap },
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
    <aside 
      className={`fixed top-0 left-0 bottom-0 bg-white border-r border-slate-200 z-50 flex flex-col justify-between py-4 shadow-sm select-none transition-all duration-300 ${
        isSidebarExpanded ? 'w-64 px-4' : 'w-16 px-2 items-center'
      }`}
    >
      <div className="space-y-6 w-full">
        
        {/* Brand Header & Toggle Button */}
        {isSidebarExpanded ? (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 w-full">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20 shrink-0">
                <Activity className="w-5 h-5 font-bold" />
              </div>
              <h1 className="font-black text-2xl text-slate-900 tracking-wide font-sans whitespace-nowrap">
                सुरक्षा सेतु
              </h1>
            </NavLink>
            <button
              onClick={toggleSidebar}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 border-b border-slate-100 pb-3 w-full">
            <NavLink
              to="/"
              title="सुरक्षा सेतु"
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 font-bold" />
              </div>
              <span className="font-black text-xs text-slate-900 tracking-tight leading-tight text-center font-sans">
                सुरक्षा<br />सेतु
              </span>
            </NavLink>
            <button
              onClick={toggleSidebar}
              title="Expand Sidebar"
              className="mt-1 p-1 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="flex flex-col gap-4.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!isSidebarExpanded ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center transition-all duration-200 relative group rounded-xl ${
                    isSidebarExpanded
                      ? 'justify-between px-3.5 py-3 text-xs font-semibold'
                      : 'justify-center w-10 h-10 mx-auto'
                  } ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm font-bold scale-105'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  {isSidebarExpanded && <span className="truncate">{item.label}</span>}
                </div>

                {item.badge && (
                  <span
                    className={
                      isSidebarExpanded
                        ? 'bg-amber-500 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full'
                        : 'absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow border border-white'
                    }
                  >
                    {item.badge}
                  </span>
                )}

                {/* Floating Tooltip when Collapsed */}
                {!isSidebarExpanded && (
                  <div className="opacity-0 group-hover:opacity-100 transition-all pointer-events-none absolute left-14 bg-slate-900 text-white font-sans text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
