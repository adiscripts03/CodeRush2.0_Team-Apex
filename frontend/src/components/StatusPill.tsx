import type { ReactElement } from "react";

interface StatusPillProps {
  label: string;
  tone: "ok" | "warn" | "neutral";
}

const toneClassName: Record<StatusPillProps["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700"
};

export function StatusPill({ label, tone }: StatusPillProps): ReactElement {
  return (
    <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${toneClassName[tone]}`}>
      {label}
    </span>
  );
}
