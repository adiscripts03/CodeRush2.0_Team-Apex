import React from 'react';
import { useApp } from '../state/AppContext';
import AlertComposer from '../components/AlertComposer';
import { Bell, CheckCircle, AlertOctagon, Mail, Clock } from 'lucide-react';

export default function AlertCentre() {
  const { sentAlerts } = useApp();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Emergency Alert & Notification Centre</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Transmit transactional email alerts directly to emergency response authority endpoints.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Alert Composer */}
          <div className="lg:col-span-7">
            <AlertComposer />
          </div>

          {/* Right Column: Sent Alert History Log */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-cyan-600" />
                  <span>Dispatched Alert History</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                  {sentAlerts.length}
                </span>
              </div>

              {sentAlerts.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {sentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700 text-[10px] uppercase truncate max-w-[180px]">
                          {alert.recipientEmail}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-rose-700 leading-snug">{alert.subject}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{alert.message}</p>

                      <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : alert.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {alert.status === 'DELIVERED' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <AlertOctagon className="w-3 h-3" />
                          )}
                          <span>{alert.status}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 italic">
                  No alerts dispatched during this session.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
