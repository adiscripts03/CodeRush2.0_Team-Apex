import React, { useState } from 'react';
import { useActivityLog } from '../lib/activityLogger';
import ActivityFeedItem from '../components/ActivityFeedItem';
import { History, Trash2, Eye, ClipboardList, CheckCircle2, Send } from 'lucide-react';

export default function ActivityLog() {
  const { logs, clearLogs } = useActivityLog();
  const [filterType, setFilterType] = useState('all');

  const filteredLogs = logs.filter(log => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const filterTabs = [
    { key: 'all', label: 'All Events', count: logs.length, icon: History },
    { key: 'observation', label: 'Observations', count: logs.filter(l => l.type === 'observation').length, icon: Eye },
    { key: 'plan', label: 'Recommendations', count: logs.filter(l => l.type === 'plan').length, icon: ClipboardList },
    { key: 'approval', label: 'Approvals', count: logs.filter(l => l.type === 'approval').length, icon: CheckCircle2 },
    { key: 'alert', label: 'Alerts', count: logs.filter(l => l.type === 'alert').length, icon: Send },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Audit Activity Stream</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Timestamped audit log recording all satellite observation scrubs, plan generations, commander approvals, and alert dispatches.
              </p>
            </div>
          </div>

          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Activity Log</span>
            </button>
          )}
        </div>

        {/* Event Type Filter Tabs */}
        <div className="flex flex-wrap gap-2 pb-2">
          {filterTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = filterType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Activity Feed List */}
        {filteredLogs.length > 0 ? (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <ActivityFeedItem key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <History className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No events matching selected filter</h3>
            <p className="text-xs text-slate-500">Perform actions across the system to record event logs.</p>
          </div>
        )}

      </div>
    </div>
  );
}
