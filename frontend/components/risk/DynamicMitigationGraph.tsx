"use client";

import { useMemo } from "react";
import { MITIGATIONS } from "@/lib/data";
import { MITIGATION_SOPS_MAP } from "@/lib/riskDetailData";
import { cn, riskBadge, riskBar, riskLabel } from "@/lib/utils";
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Activity,
  AlertTriangle,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

interface DynamicMitigationGraphProps {
  baselineRisk: number;
  vesselIceClass: string;
  acked: Record<string, boolean>;
  hoveredMitigationId: string | null;
  onSelectMitigation?: (id: string) => void;
}

interface CategorySpec {
  id: "safety" | "operational" | "environmental";
  label: string;
  subtitle: string;
  baseWeight: number;
  mitigationIds: string[];
  color: string;
  accentClass: string;
}

const CATEGORIES: CategorySpec[] = [
  {
    id: "safety",
    label: "Safety & Collision Avoidance",
    subtitle: "Iceberg standoff & growler watchkeeping",
    baseWeight: 42,
    mitigationIds: ["m2", "m4"],
    color: "#2563eb",
    accentClass: "bg-blue-600",
  },
  {
    id: "operational",
    label: "Tactical & Operational Limits",
    subtitle: "Pack speed ceiling, daylight transit & escort",
    baseWeight: 36,
    mitigationIds: ["m1", "m3", "m5"],
    color: "#059669",
    accentClass: "bg-emerald-600",
  },
  {
    id: "environmental",
    label: "Environmental & Logistics",
    subtitle: "Fuel reserves & contingency anchorage",
    baseWeight: 22,
    mitigationIds: ["m6", "m7"],
    color: "#d97706",
    accentClass: "bg-amber-600",
  },
];

// Weights assigned to each mitigation SOP for real-time reduction calculation
const MITIGATION_WEIGHTS: Record<string, number> = {
  m1: 0.14, // Speed reduction: 14%
  m2: 0.26, // Iceberg standoff: 26%
  m3: 0.12, // Daylight transit: 12%
  m4: 0.12, // Extra ice watch: 12%
  m5: 0.08, // Escort standby: 8%
  m6: 0.10, // Fuel reserve: 10%
  m7: 0.12, // Contingency anchorage: 12%
};

export function DynamicMitigationGraph({
  baselineRisk,
  vesselIceClass,
  acked,
  hoveredMitigationId,
  onSelectMitigation,
}: DynamicMitigationGraphProps) {
  // Compute total acknowledged count & ratio
  const ackedIds = useMemo(
    () => Object.entries(acked).filter(([, v]) => v).map(([k]) => k),
    [acked]
  );
  const ackedCount = ackedIds.length;
  const totalCount = MITIGATIONS.length;

  // Real-time reduction calculation
  const totalReductionFraction = useMemo(() => {
    let fraction = 0;
    for (const id of ackedIds) {
      fraction += MITIGATION_WEIGHTS[id] ?? 0.08;
    }
    // Cap reduction fraction to 85% to preserve residual baseline
    return Math.min(0.85, fraction);
  }, [ackedIds]);

  const residualRisk = useMemo(() => {
    const reduced = Math.round(baselineRisk * (1 - totalReductionFraction));
    return Math.max(3, reduced);
  }, [baselineRisk, totalReductionFraction]);

  const pointsEliminated = Math.max(0, baselineRisk - residualRisk);
  const percentageReduced = baselineRisk > 0 ? Math.round((pointsEliminated / baselineRisk) * 100) : 0;

  // Polar code mandatory status
  const mandatoryIds = useMemo(() => {
    return MITIGATIONS.filter((m) => {
      const sop = MITIGATION_SOPS_MAP[m.id];
      if (!sop) return m.status === "mandatory";
      const app = sop.applicability.find((a) => a.class === vesselIceClass);
      return app ? app.status === "Mandatory" : m.status === "mandatory";
    }).map((m) => m.id);
  }, [vesselIceClass]);

  const mandatoryAckedCount = mandatoryIds.filter((id) => !!acked[id]).length;
  const isPolarCodeCompliant = mandatoryIds.length > 0 && mandatoryAckedCount === mandatoryIds.length;

  // Category breakdown live computations
  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const totalCatWeight = cat.mitigationIds.reduce(
        (sum, id) => sum + (MITIGATION_WEIGHTS[id] ?? 0.1),
        0
      );
      const ackedCatWeight = cat.mitigationIds.reduce((sum, id) => {
        return sum + (acked[id] ? MITIGATION_WEIGHTS[id] ?? 0.1 : 0);
      }, 0);

      const catAckedCount = cat.mitigationIds.filter((id) => acked[id]).length;
      const catTotalCount = cat.mitigationIds.length;
      const catReductionRatio = totalCatWeight > 0 ? ackedCatWeight / totalCatWeight : 0;

      const baseScore = Math.round((baselineRisk * cat.baseWeight) / 100);
      const residualScore = Math.max(1, Math.round(baseScore * (1 - catReductionRatio * 0.85)));
      const deltaScore = baseScore - residualScore;

      const isHovered = hoveredMitigationId ? cat.mitigationIds.includes(hoveredMitigationId) : false;

      return {
        ...cat,
        baseScore,
        residualScore,
        deltaScore,
        catAckedCount,
        catTotalCount,
        catReductionRatio,
        isHovered,
      };
    });
  }, [baselineRisk, acked, hoveredMitigationId]);

  // Semicircular Gauge calculation helper
  // Semicircle arc: 180 degrees from 180° to 0° (or -180° to 0°)
  // SVG radius 60, circumference of semicircle = PI * 60 ~= 188.5
  const ARC_RADIUS = 64;
  const ARC_CIRCUMFERENCE = Math.PI * ARC_RADIUS; // 201.06

  const baselineArcOffset = ARC_CIRCUMFERENCE - (baselineRisk / 100) * ARC_CIRCUMFERENCE;
  const residualArcOffset = ARC_CIRCUMFERENCE - (residualRisk / 100) * ARC_CIRCUMFERENCE;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-navy-900">
              Live Residual Risk &amp; Mitigation Impact
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Real-time hydrodynamic &amp; tactical response model
          </p>
        </div>

        {/* Polar Code Compliance Pill */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-300",
            isPolarCodeCompliant
              ? "border-risk-low/30 bg-risk-low-bg text-risk-low"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700"
          )}
        >
          {isPolarCodeCompliant ? (
            <>
              <ShieldCheck size={14} className="text-risk-low" />
              <span>IMO Polar Code: Safe</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} className="text-amber-600" />
              <span>
                {mandatoryIds.length - mandatoryAckedCount} Mandatory Pending
              </span>
            </>
          )}
        </div>
      </div>

      {/* Dual Gauges Section: Baseline vs. Live Mitigated Residual */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/70 bg-surface2/40 p-4">
        {/* Baseline Corridor Risk Gauge */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Corridor Baseline Risk
          </span>
          <div className="relative mt-2 flex items-center justify-center">
            <svg width="150" height="90" viewBox="0 0 150 90" className="overflow-visible select-none">
              {/* Background Arc */}
              <path
                d="M 11 80 A 64 64 0 0 1 139 80"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Baseline Arc */}
              <path
                d="M 11 80 A 64 64 0 0 1 139 80"
                fill="none"
                stroke={baselineRisk > 60 ? "var(--color-risk-high)" : baselineRisk > 35 ? "var(--color-risk-med)" : "var(--color-risk-low)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ARC_CIRCUMFERENCE}
                strokeDashoffset={baselineArcOffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute top-10 flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-navy-900">
                {baselineRisk}
              </span>
              <span className="text-[10px] text-text-subtle font-mono">/ 100</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                riskBadge(baselineRisk)
              )}
            >
              {riskLabel(baselineRisk)}
            </span>
            <span className="text-[10px] text-text-muted">Pre-Mitigation</span>
          </div>
        </div>

        {/* Live Residual Risk Gauge */}
        <div className="flex flex-col items-center justify-center text-center border-l border-border/60 pl-4">
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Live Residual Risk
            </span>
          </div>

          <div className="relative mt-2 flex items-center justify-center">
            <svg width="150" height="90" viewBox="0 0 150 90" className="overflow-visible select-none">
              <defs>
                <linearGradient id="residualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="70%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              {/* Background Arc */}
              <path
                d="M 11 80 A 64 64 0 0 1 139 80"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Residual Dynamic Arc */}
              <path
                d="M 11 80 A 64 64 0 0 1 139 80"
                fill="none"
                stroke={residualRisk < 20 ? "var(--color-risk-low)" : residualRisk < 40 ? "var(--color-risk-med)" : "var(--color-risk-high)"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ARC_CIRCUMFERENCE}
                strokeDashoffset={residualArcOffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute top-10 flex flex-col items-center">
              <span className={cn("font-mono text-2xl font-black transition-colors duration-300", residualRisk < 20 ? "text-risk-low" : residualRisk < 40 ? "text-blue-700" : "text-amber-700")}>
                {residualRisk}
              </span>
              <span className="text-[10px] text-text-subtle font-mono">/ 100</span>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1.5 flex-wrap justify-center">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                riskBadge(residualRisk)
              )}
            >
              {riskLabel(residualRisk)}
            </span>
            {pointsEliminated > 0 ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-risk-low-bg px-1.5 py-0.5 text-[10px] font-mono font-bold text-risk-low border border-risk-low/20 animate-fade-in">
                <TrendingDown size={10} /> -{pointsEliminated} pts (-{percentageReduced}%)
              </span>
            ) : (
              <span className="text-[10px] text-text-subtle italic">No measures active</span>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Impact Metric Strip */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="rounded-lg border border-border bg-surface p-2.5">
          <p className="text-[10px] font-semibold uppercase text-text-muted">Measures Active</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-navy-900">
            {ackedCount} <span className="text-xs font-normal text-text-subtle">/ {totalCount}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2.5">
          <p className="text-[10px] font-semibold uppercase text-text-muted">Risk Eliminated</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-risk-low">
            -{pointsEliminated} <span className="text-xs font-normal text-text-muted">pts</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2.5">
          <p className="text-[10px] font-semibold uppercase text-text-muted">Reduction Efficiency</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-blue-700">
            {percentageReduced}%
          </p>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="text-text-muted" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Risk Reduction by Domain
            </h4>
          </div>
          <span className="text-[10px] text-text-subtle">Live Score / Baseline</span>
        </div>

        <div className="space-y-2.5">
          {categoryStats.map((cat) => (
            <div
              key={cat.id}
              className={cn(
                "rounded-lg border p-3 transition-all duration-200",
                cat.isHovered
                  ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-400 shadow-xs"
                  : "border-border bg-surface hover:border-border-strong"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy-900">{cat.label}</span>
                    <span className="rounded bg-surface2 px-1.5 py-0.2 text-[9px] font-mono text-text-muted">
                      {cat.catAckedCount}/{cat.catTotalCount} active
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">{cat.subtitle}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1.5 font-mono text-xs font-bold">
                    <span className={cn("transition-colors", cat.deltaScore > 0 ? "text-risk-low" : "text-navy-900")}>
                      {cat.residualScore}
                    </span>
                    <span className="text-[10px] font-normal text-text-subtle">
                      / {cat.baseScore} pts
                    </span>
                  </div>
                  {cat.deltaScore > 0 && (
                    <span className="text-[10px] font-mono text-risk-low font-semibold">
                      -{cat.deltaScore} pts ({Math.round((cat.deltaScore / cat.baseScore) * 100)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar (Dual: Baseline Track + Live Residual Bar) */}
              <div className="mt-2 relative h-2 w-full rounded-full bg-border overflow-hidden">
                {/* Initial baseline marker */}
                <div
                  className="absolute inset-y-0 left-0 bg-border-strong opacity-40 rounded-full"
                  style={{ width: `${Math.min(100, cat.baseScore * 2.5)}%` }}
                />
                {/* Active residual score bar */}
                <div
                  className={cn(
                    "relative h-full rounded-full transition-all duration-500",
                    cat.accentClass
                  )}
                  style={{ width: `${Math.min(100, cat.residualScore * 2.5)}%` }}
                />
              </div>

              {/* Mitigation tags in category */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cat.mitigationIds.map((mId) => {
                  const isAck = !!acked[mId];
                  const isThisHovered = hoveredMitigationId === mId;
                  const sop = MITIGATION_SOPS_MAP[mId];
                  const title = sop ? sop.title : mId;

                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => onSelectMitigation?.(mId)}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-mono transition-all cursor-pointer border",
                        isAck
                          ? "bg-risk-low-bg border-risk-low/30 text-risk-low font-bold"
                          : "bg-surface2 border-border text-text-muted hover:border-border-strong",
                        isThisHovered && "ring-1 ring-blue-500 scale-105"
                      )}
                      title={`Inspect SOP: ${title}`}
                    >
                      {isAck ? "✓ " : "○ "}
                      {title.length > 18 ? title.slice(0, 16) + "…" : title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advisory Note */}
      <div className="rounded-lg bg-surface2 p-3 text-[11px] text-text-muted flex items-start gap-2 border border-border/60">
        <ShieldAlert size={14} className="text-text-subtle shrink-0 mt-0.5" />
        <span>
          Residual scores update dynamically upon Master checklist acknowledgment in accordance with IMO Polar Code §1.5 operational safeguards.
        </span>
      </div>
    </div>
  );
}
