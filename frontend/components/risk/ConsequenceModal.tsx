"use client";

import { RiskModalBase } from "./RiskModalBase";
import { CONSEQUENCE_DETAILS_MAP } from "@/lib/riskDetailData";
import { riskBadge, riskBar, riskLabel, cn } from "@/lib/utils";
import type { Vessel, RouteAlternative } from "@/lib/data";
import { AlertTriangle, ShieldCheck, Scale, History, BookOpen, Compass, CheckCircle2 } from "lucide-react";

export interface ConsequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  consequenceKey: string | null;
  consequenceScore: number;
  consequenceValue: string;
  vessel: Vessel;
  selectedRoute: RouteAlternative;
}

export function ConsequenceModal({
  isOpen,
  onClose,
  consequenceKey,
  consequenceScore,
  consequenceValue,
  vessel,
  selectedRoute,
}: ConsequenceModalProps) {
  if (!consequenceKey) return null;

  const detail = CONSEQUENCE_DETAILS_MAP[consequenceKey] ?? CONSEQUENCE_DETAILS_MAP.besetment;
  const limits = detail.vesselLimits[vessel.iceClass] ?? detail.vesselLimits.PC4;

  return (
    <RiskModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={detail.label}
      subtitle={detail.shortDesc}
      badge={
        <span className={cn("rounded border px-2 py-0.5 font-mono text-xs font-bold", riskBadge(consequenceScore))}>
          Score {consequenceScore}/100 · {consequenceValue}
        </span>
      }
      footer={
        <>
          <span className="text-xs text-text-subtle">
            Evaluated for <strong>{selectedRoute.name}</strong> · Hull: {vessel.name} ({vessel.iceClass})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Dismiss Analysis
          </button>
        </>
      }
    >
      {/* 1. Dynamic Metric Summary Banner */}
      <div className="rounded-xl border border-border bg-surface2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Current Assessment</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-navy-900">{consequenceValue}</span>
              <span className="text-xs text-text-muted">({riskLabel(consequenceScore)} severity rating)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl font-bold text-navy-900">{consequenceScore}</span>
            <span className="text-xs text-text-subtle font-mono">/100</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", riskBar(consequenceScore))} style={{ width: `${Math.min(consequenceScore, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* 2. Factor Decomposition */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Scale size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">Detailed Factor Decomposition</h3>
          <span className="text-[11px] text-text-subtle">Weighted physical drivers</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detail.factors.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-surface p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-navy-900">{f.name}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    f.impact === "HIGH"
                      ? "bg-risk-high-bg text-risk-high border border-risk-high/20"
                      : f.impact === "MODERATE"
                      ? "bg-risk-med-bg text-risk-med border border-risk-med/20"
                      : "bg-risk-low-bg text-risk-low border border-risk-low/20"
                  )}
                >
                  {f.impact} ({f.weightPct}%)
                </span>
              </div>
              <p className="mt-1.5 text-xs text-text-muted">{f.description}</p>
              <div className="mt-2.5 rounded bg-surface2 px-2 py-1 text-[11px] text-text-subtle font-mono">
                Driver: {f.physicalDriver}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Historical Polar Baseline Comparison */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <History size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">10-Year Decadal Polar Baseline</h3>
          <span className="text-[11px] text-text-subtle">{detail.historicalBaseline.region}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 border-y border-border py-3 my-2 text-center">
          <div>
            <div className="text-[11px] text-text-muted">10-Yr Decadal Mean</div>
            <div className="mt-0.5 font-mono text-base font-bold text-navy-900">{detail.historicalBaseline.tenYearMeanScore}/100</div>
          </div>
          <div>
            <div className="text-[11px] text-text-muted">Seasonal Percentile</div>
            <div className="mt-0.5 font-mono text-base font-bold text-navy-900">{detail.historicalBaseline.percentile}th</div>
          </div>
          <div>
            <div className="text-[11px] text-text-muted">Voyage Delta</div>
            <div className="mt-0.5 font-mono text-xs font-bold text-blue-600">{detail.historicalBaseline.deltaVsVoyage}</div>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted leading-relaxed">
          {detail.historicalBaseline.climatologicalNotes}
        </p>
      </div>

      {/* 4. IMO Polar Code Regulatory Clauses */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">IMO Polar Code Statutory Reference</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="font-mono text-xs font-bold text-navy-900">{detail.polarCode.chapter}</span>
          <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] text-blue-600 font-semibold">{detail.polarCode.clause}</span>
        </div>
        <h4 className="text-xs font-semibold text-navy-900">{detail.polarCode.title}</h4>
        <p className="mt-1 text-xs text-text-muted leading-relaxed">{detail.polarCode.summary}</p>
        {detail.polarCode.polarisGuidance && (
          <div className="mt-2 rounded bg-surface2 p-2 text-xs text-navy-900 font-mono">
            {detail.polarCode.polarisGuidance}
          </div>
        )}
      </div>

      {/* 5. Prevention Tactics & Bridge Orders */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">Tactical Prevention &amp; Bridge Orders</h3>
        </div>
        <ul className="space-y-2 mt-2">
          {detail.preventionTactics.map((tactic, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
              <CheckCircle2 size={14} className="text-risk-low shrink-0 mt-0.5" />
              <span>{tactic}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 6. Active Vessel Envelope & Warning Banner */}
      <div className={cn(
        "rounded-xl border p-4",
        limits.warningAlert
          ? "border-risk-high/40 bg-risk-high-bg text-risk-high"
          : "border-border bg-surface2 text-navy-900"
      )}>
        <div className="flex items-start gap-3">
          {limits.warningAlert ? (
            <AlertTriangle size={20} className="shrink-0 text-risk-high mt-0.5" />
          ) : (
            <ShieldCheck size={20} className="shrink-0 text-risk-low mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {limits.warningAlert ? "Statutory Polar Water Alert" : "Operational Hull Envelope"}
            </h4>
            <p className="mt-1 text-xs font-medium">
              {limits.warningAlert || limits.operationalEnvelope}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
              <span>Hull Class: <strong>{vessel.iceClass}</strong></span>
              <span>Max Ice Thickness: <strong>{limits.maxIceThicknessM}m</strong></span>
              <span>Speed Ceiling: <strong>{limits.speedCeilingKn} kn</strong></span>
              <span>Escort Required: <strong>{limits.escortRequired ? "YES" : "NO"}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </RiskModalBase>
  );
}
