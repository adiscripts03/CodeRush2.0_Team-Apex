import React from 'react';
import { Eye, ClipboardList, CheckCircle2, Send, Clock } from 'lucide-react';

export default function ActivityFeedItem({ log }) {
  const { type, message, timestamp } = log;

  let Icon = Eye;
  let iconStyle = 'bg-cyan-50 text-cyan-700 border-cyan-200';
  let badgeLabel = 'Observation';

  if (type === 'plan') {
    Icon = ClipboardList;
    iconStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeLabel = 'Plan Recommendation';
  } else if (type === 'approval') {
    Icon = CheckCircle2;
    iconStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    badgeLabel = 'Human Approval';
  } else if (type === 'alert') {
    Icon = Send;
    iconStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeLabel = 'Alert Dispatch';
  }

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-sm">
      <div className={`p-2 rounded-lg border ${iconStyle} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500">
            {badgeLabel}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{formattedDate} {formattedTime}</span>
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-800 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
