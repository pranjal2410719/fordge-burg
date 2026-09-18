"use client";

import { RiskModalBase } from "./RiskModalBase";
import { MITIGATION_SOPS_MAP } from "@/lib/riskDetailData";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, BookOpen, Layers, ShieldCheck, TrendingDown, Users } from "lucide-react";

export interface MitigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mitigationId: string | null;
  isAcknowledged: boolean;
  onToggleAcknowledge: (id: string) => void;
  activeVesselClass: string;
}

const STATUS_PILL: Record<string, string> = {
  Mandatory:   "bg-risk-high-bg text-risk-high border-risk-high/30",
  Recommended: "bg-risk-med-bg text-risk-med border-risk-med/30",
  Advisory:    "bg-surface2 text-text-muted border-border",
  Prohibited:  "bg-risk-high text-white border-risk-high",
  Exempt:      "bg-risk-low-bg text-risk-low border-risk-low/30",
};

export function MitigationModal({
  isOpen,
  onClose,
  mitigationId,
  isAcknowledged,
  onToggleAcknowledge,
  activeVesselClass,
}: MitigationModalProps) {
  if (!mitigationId) return null;

  const sop = MITIGATION_SOPS_MAP[mitigationId] ?? MITIGATION_SOPS_MAP.m1;

  return (
    <RiskModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={sop.title}
      subtitle={`Standard Operating Procedure & Statutory Compliance · Category: ${sop.category}`}
      badge={
        <span className={cn(
          "rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
          isAcknowledged
            ? "bg-risk-low-bg text-risk-low border-risk-low/30"
            : "bg-risk-high-bg text-risk-high border-risk-high/30"
        )}>
          {isAcknowledged ? "Acknowledged" : "Pending Acknowledgment"}
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => onToggleAcknowledge(sop.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors border cursor-pointer",
              isAcknowledged
                ? "bg-risk-low-bg text-risk-low border-risk-low/30 hover:bg-risk-low/10"
                : "bg-navy-900 text-white border-navy-900 hover:bg-navy-800"
            )}
          >
            {isAcknowledged ? (
              <>
                <CheckCircle2 size={16} /> Measure Acknowledged (Click to Revoke)
              </>
            ) : (
              <>
                <Circle size={16} /> Acknowledge Tactical Measure
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-navy-900 hover:bg-surface2 transition-colors cursor-pointer"
          >
            Close SOP
          </button>
        </>
      }
    >
      {/* 1. 3-Phase Standard Operating Procedure */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-navy-900">Standard Operating Procedure (SOP)</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Users size={14} />
            <span>Roles: {sop.responsibleRoles.join(", ")}</span>
          </div>
        </div>

        <div className="space-y-3">
          {sop.phases.map((phase, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-surface p-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wide">
                  {phase.phase}: {phase.title}
                </span>
              </div>
              <ul className="mt-2.5 space-y-1.5 pl-7">
                {phase.steps.map((step, sIdx) => (
                  <li key={sIdx} className="list-disc text-xs text-text-secondary leading-relaxed">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 2. IMO Polar Code Regulatory Reference */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">IMO Polar Code Regulatory Reference</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-navy-900">{sop.polarCodeRef.chapter}</span>
          <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] text-blue-600 font-semibold">
            {sop.polarCodeRef.regulation}
          </span>
        </div>
        <h4 className="text-xs font-semibold text-navy-900">{sop.polarCodeRef.title}</h4>
        <p className="mt-1.5 text-xs text-text-muted leading-relaxed italic border-l-2 border-blue-600 pl-3">
          &ldquo;{sop.polarCodeRef.text}&rdquo;
        </p>
      </div>

      {/* 3. Vessel Ice-Class Applicability Matrix */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">Vessel Ice-Class Applicability Matrix</h3>
          <span className="text-[11px] text-text-subtle">Active Vessel: <strong>{activeVesselClass}</strong></span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {sop.applicability.map((app) => {
            const isActive = app.class === activeVesselClass;
            return (
              <div
                key={app.class}
                className={cn(
                  "rounded-xl border p-3 transition-all",
                  isActive
                    ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40 shadow-xs"
                    : "border-border bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-navy-900">
                    {app.class} {isActive && <span className="text-[10px] font-sans text-blue-600">(Active)</span>}
                  </span>
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", STATUS_PILL[app.status])}>
                    {app.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-muted leading-snug">{app.guidance}</p>
                <div className="mt-2 text-[10px] font-mono text-text-subtle">{app.operationalLimits}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Expected Risk Reduction Impact */}
      <div className="rounded-xl border border-risk-low/30 bg-risk-low-bg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} className="text-risk-low" />
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
              Expected Risk Reduction: {sop.riskReduction.targetMetric}
            </h4>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-risk-low">{sop.riskReduction.riskScoreDelta} pts</span>
            <span className="font-mono text-xs font-semibold text-risk-low">({sop.riskReduction.percentageReduction})</span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-secondary">
          <span className="rounded bg-surface px-2 py-0.5 border border-risk-low/20 font-mono">
            {sop.riskReduction.confidence}
          </span>
          {sop.riskReduction.coBenefits.map((b, i) => (
            <span key={i} className="rounded bg-surface px-2 py-0.5 border border-border">
              + {b}
            </span>
          ))}
        </div>
      </div>
    </RiskModalBase>
  );
}
