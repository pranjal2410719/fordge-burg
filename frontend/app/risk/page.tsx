"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MITIGATIONS } from "@/lib/data";
import { useMission } from "@/components/session/MissionContext";
import { cn, riskBadge, riskBar, riskLabel } from "@/lib/utils";
import { CheckCircle2, Circle, AlertTriangle, ShieldCheck, Siren } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  mandatory:   "border-risk-high/30 bg-risk-high-bg text-risk-high",
  recommended: "border-risk-med/30 bg-risk-med-bg text-risk-med",
  advisory:    "border-border bg-surface2 text-text-muted",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  mandatory:   Siren,
  recommended: AlertTriangle,
  advisory:    ShieldCheck,
};

const CONSEQUENCE_METRICS = [
  { key: "besetment",    label: "Besetment Risk",    desc: "Vessel trapped in ice" },
  { key: "delay",        label: "Transit Delay Risk", desc: "ETA overrun" },
  { key: "fuel",         label: "Fuel Penalty",       desc: "Reserve burn above plan" },
  { key: "disruption",   label: "Route Disruption",   desc: "Forced re-routing probability" },
];

export default function RiskPage() {
  const { selectedRoute, vessel } = useMission();
  const [acked, setAcked] = useState<Record<string, boolean>>({});

  const isOpenWater = vessel.iceClass === "OpenWater";
  const risk = selectedRoute.averageRiskScore;

  const consequences = [
    { key: "besetment",  label: "Besetment Risk",    score: isOpenWater ? 75 : 35, value: isOpenWater ? "High" : "Moderate" },
    { key: "delay",      label: "Transit Delay Risk", score: Math.round(risk / 10) * 10, value: `${Math.round(risk / 10)} hrs` },
    { key: "fuel",       label: "Fuel Penalty",       score: Math.round(risk / 5) * 5,   value: `${Math.round(risk / 5)}%` },
    { key: "disruption", label: "Route Disruption",   score: risk > 50 ? 70 : 30,        value: risk > 50 ? "High" : "Low" },
  ];

  const ackedCount = Object.values(acked).filter(Boolean).length;
  const allAcked = ackedCount === MITIGATIONS.length;

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Risk &amp; Mitigation</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            Consequence analysis for <strong className="text-navy-900">{selectedRoute.name}</strong> · Vessel: {vessel.name}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold", riskBadge(risk))}>
          Avg risk {risk}/100
        </span>
      </div>

      {/* Consequence grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {consequences.map((c) => (
          <div key={c.key} className={cn("rounded-xl border border-border bg-surface p-4 shadow-sm")}>
            <p className="text-xs font-medium text-text-muted">{c.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-navy-900">{c.value}</p>
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div className={cn("h-full rounded-full", riskBar(c.score))} style={{ width: `${Math.min(c.score, 100)}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-text-subtle">{riskLabel(c.score)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mitigation checklist */}
      <div className="mt-4 rounded-xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Mitigation Checklist</h2>
            <p className="mt-0.5 text-xs text-text-muted">7 tactical measures · {ackedCount}/{MITIGATIONS.length} acknowledged</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress ring */}
            <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={allAcked ? "var(--color-risk-low)" : "var(--color-blue-600)"}
                strokeWidth="3"
                strokeDasharray={`${(ackedCount / MITIGATIONS.length) * 94.2} 94.2`}
                className="transition-all duration-300"
              />
            </svg>
            <button
              onClick={() => setAcked(Object.fromEntries(MITIGATIONS.map((m) => [m.id, true])))}
              disabled={allAcked}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                allAcked
                  ? "bg-risk-low-bg text-risk-low border border-risk-low/30 cursor-default"
                  : "bg-navy-900 text-white hover:bg-navy-800"
              )}
            >
              {allAcked ? "All acknowledged" : "Acknowledge all"}
            </button>
          </div>
        </div>

        {/* Mitigation items */}
        <ul className="divide-y divide-border">
          {MITIGATIONS.map((m) => {
            const StatusIcon = STATUS_ICON[m.status];
            const isAcked = !!acked[m.id];
            return (
              <li
                key={m.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors",
                  isAcked ? "bg-surface2" : "hover:bg-surface2/60"
                )}
              >
                <button
                  className="mt-0.5 shrink-0"
                  onClick={() => setAcked((s) => ({ ...s, [m.id]: !s[m.id] }))}
                  aria-label={isAcked ? "Unacknowledge" : "Acknowledge"}
                >
                  {isAcked
                    ? <CheckCircle2 size={18} className="text-risk-low" />
                    : <Circle size={18} className="text-border-strong" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "text-sm font-semibold",
                      isAcked ? "text-text-muted line-through" : "text-navy-900"
                    )}>
                      {m.title}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                      STATUS_STYLE[m.status]
                    )}>
                      <StatusIcon size={9} />
                      {m.status}
                    </span>
                  </div>
                  <p className={cn("mt-0.5 text-xs", isAcked ? "text-text-subtle" : "text-text-muted")}>
                    {m.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* SOLAS note */}
      <div className="mt-4 rounded-xl border border-border bg-surface2 px-4 py-3">
        <p className="text-xs text-text-subtle">
          <strong className="text-text-muted">Advisory only.</strong> The Master and Ice Pilot retain sole command authority. These mitigations are recommendations — they do not substitute for professional ice navigation judgment.
        </p>
      </div>
    </AppShell>
  );
}
