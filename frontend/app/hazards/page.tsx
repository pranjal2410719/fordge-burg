"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useMission } from "@/components/session/MissionContext";
import { cn, riskBadge, riskBar } from "@/lib/utils";
import { useState } from "react";

interface HazardZone {
  id: string;
  name: string;
  type: string;
  riskScore: number;
  severity: "Critical" | "High" | "Moderate" | "Low";
  factors: { label: string; score: number }[];
  recommendation: string;
}

const HAZARD_ZONES: HazardZone[] = [
  {
    id: "H1", name: "Antarctic Sound Pressure Ridge", type: "Pressure Ridge", riskScore: 78, severity: "High",
    factors: [
      { label: "Ice pressure",    score: 85 },
      { label: "Drift dynamics",  score: 72 },
      { label: "Vessel exposure", score: 68 },
    ],
    recommendation: "Avoid during spring ice movement. Icebreaker escort recommended for PC4+ hull class.",
  },
  {
    id: "H2", name: "Joinville Bank Grounding Shallows", type: "Grounding / Shoal", riskScore: 58, severity: "Moderate",
    factors: [
      { label: "Depth clearance", score: 65 },
      { label: "Survey currency", score: 50 },
      { label: "Drift overlay",   score: 55 },
    ],
    recommendation: "Reduce speed and post continuous echo sounder watch. Do not transit in poor visibility.",
  },
  {
    id: "H3", name: "Weddell Multi-Year Ice", type: "Multi-Year Ice", riskScore: 82, severity: "High",
    factors: [
      { label: "Ice thickness",   score: 90 },
      { label: "Compaction",      score: 80 },
      { label: "Besetment prob.", score: 75 },
    ],
    recommendation: "Mandatory speed throttle × 0.75. Day-light transit only. PC2 class minimum.",
  },
  {
    id: "H4", name: "Larsen Fast Ice", type: "Fast Ice", riskScore: 95, severity: "Critical",
    factors: [
      { label: "Ice solidity",    score: 98 },
      { label: "Break-up risk",   score: 88 },
      { label: "Route blockage",  score: 95 },
    ],
    recommendation: "RESTRICTED — icebreaker escort required. Speed ≤ 2.5 kn or vessel ice-speed limit.",
  },
  {
    id: "H5", name: "Erebus Drift Field", type: "Drift Ice Field", riskScore: 52, severity: "Moderate",
    factors: [
      { label: "Floe density",    score: 60 },
      { label: "Drift speed",     score: 45 },
      { label: "Visibility",      score: 55 },
    ],
    recommendation: "Post ice watch. Reduce speed to ice transit limit. Monitor trajectory closely.",
  },
  {
    id: "H6", name: "Bransfield Open-Lead Fairway", type: "Open Water Lead", riskScore: 20, severity: "Low",
    factors: [
      { label: "Ice exposure",    score: 18 },
      { label: "Sea state",       score: 22 },
      { label: "Vessel clearance",score: 20 },
    ],
    recommendation: "Preferred transit corridor. Monitor lead closure. Normal operational speed.",
  },
];

const SEV_STYLE: Record<string, string> = {
  Critical: "border-risk-high/40 bg-risk-high-bg text-risk-high",
  High:     "border-risk-high/30 bg-risk-high-bg text-risk-high",
  Moderate: "border-risk-med/30 bg-risk-med-bg text-risk-med",
  Low:      "border-risk-low/30 bg-risk-low-bg text-risk-low",
};

export default function HazardsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = HAZARD_ZONES.find((h) => h.id === selectedId);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Hazard Intelligence</h1>
        <p className="mt-0.5 text-sm text-text-muted">6 spatial zones · fused risk scoring · factor decomposition</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Hazard matrix */}
        <div className="xl:col-span-2 space-y-3">
          {HAZARD_ZONES.map((hz) => (
            <button
              key={hz.id}
              onClick={() => setSelectedId(selectedId === hz.id ? null : hz.id)}
              className={cn(
                "w-full rounded-xl border bg-surface p-4 text-left shadow-sm transition-all",
                selectedId === hz.id
                  ? "border-blue-600 ring-1 ring-blue-600/20"
                  : "border-border hover:border-border-strong hover:shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-navy-900">{hz.name}</span>
                    <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold", SEV_STYLE[hz.severity])}>
                      {hz.severity}
                    </span>
                    <span className="text-[10px] text-text-subtle">{hz.type}</span>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded border px-2 py-0.5 font-mono text-sm font-bold", riskBadge(hz.riskScore))}>
                  {hz.riskScore}
                </span>
              </div>

              {/* Risk bar */}
              <div className="mt-3">
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", riskBar(hz.riskScore))} style={{ width: `${hz.riskScore}%` }} />
                </div>
              </div>

              {/* Factor bars (expanded) */}
              {selectedId === hz.id && (
                <div className="mt-4 animate-fade-in space-y-3">
                  <p className="text-xs font-semibold text-text-muted">Factor Decomposition</p>
                  {hz.factors.map((f) => (
                    <div key={f.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-secondary">{f.label}</span>
                        <span className="font-mono font-semibold text-navy-900">{f.score}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div className={cn("h-full rounded-full", riskBar(f.score))} style={{ width: `${f.score}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="rounded-lg border border-border bg-surface2 p-3 mt-2">
                    <p className="text-xs font-semibold text-text-muted mb-1">Recommendation</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{hz.recommendation}</p>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Summary panel */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-navy-900 mb-3">Zone Summary</h2>
            <div className="space-y-2">
              {(["Critical","High","Moderate","Low"] as const).map((sev) => {
                const count = HAZARD_ZONES.filter(h => h.severity === sev).length;
                return (
                  <div key={sev} className="flex items-center justify-between">
                    <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold", SEV_STYLE[sev])}>{sev}</span>
                    <span className="font-mono text-sm font-bold text-navy-900">{count}</span>
                  </div>
                );
              })}
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="text-xs text-text-muted">Avg risk score</span>
                <span className="font-mono text-sm font-bold text-navy-900">
                  {Math.round(HAZARD_ZONES.reduce((a, h) => a + h.riskScore, 0) / HAZARD_ZONES.length)}
                </span>
              </div>
            </div>
          </div>

          {/* Selected zone inspector */}
          {selected ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 animate-fade-in">
              <h2 className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">Zone Inspector · {selected.id}</h2>
              <p className="text-sm font-bold text-navy-900">{selected.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{selected.type}</p>
              <p className="mt-3 text-xs text-text-secondary leading-relaxed">{selected.recommendation}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-xs text-text-subtle">Click a hazard zone to open the inspector</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
