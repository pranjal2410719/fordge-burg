"use client";

import { useState, useMemo } from "react";
import { MITIGATIONS, type Mitigation } from "@/lib/data";
import { MITIGATION_SOPS_MAP } from "@/lib/riskDetailData";
import { cn, riskBadge, riskBar } from "@/lib/utils";
import { MitigationImpactRadar } from "./MitigationImpactRadar";
import { MitigationRiskReductionPlot } from "./MitigationRiskReductionPlot";
import { MitigationHeatmap } from "./MitigationHeatmap";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Users,
  Activity,
  CheckCircle2,
  Circle,
} from "lucide-react";

const STATUS_ICON: Record<string, React.ElementType> = {
  mandatory: ShieldAlert,
  recommended: AlertTriangle,
  advisory: ShieldCheck,
};

const STATUS_COLORS: Record<string, string> = {
  mandatory: "#c0392b",
  recommended: "#d4910a",
  advisory: "#6b7280",
};

type AnalyticsTab = "overview" | "radar" | "reduction" | "matrix";

interface MitigationAnalyticsProps {
  activeVesselClass: string;
  acked: Record<string, boolean>;
}

export function MitigationAnalytics({ activeVesselClass, acked }: MitigationAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [selectedMitigationId, setSelectedMitigationId] = useState<string | null>(null);

  const ackedCount = Object.values(acked).filter(Boolean).length;
  const allAcked = ackedCount === MITIGATIONS.length;

  const totalRiskReduced = useMemo(
    () => Object.values(MITIGATION_SOPS_MAP).reduce((acc, m) => acc + Math.abs(m.riskReduction.riskScoreDelta), 0),
    []
  );

  const avgReductionPct = useMemo(
    () => Math.round(Object.values(MITIGATION_SOPS_MAP).reduce((acc, m) => acc + parseInt(m.riskReduction.percentageReduction), 0) / MITIGATIONS.length),
    []
  );

  const mandatoryCoverage = useMemo(
    () => Object.values(MITIGATION_SOPS_MAP).filter((m) => m.applicability.some((a) => a.class === activeVesselClass && a.status === "Mandatory")).length,
    [activeVesselClass]
  );

  const tabs: { id: AnalyticsTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "radar", label: "Impact Radar", icon: Users },
    { id: "reduction", label: "Risk Reduction", icon: TrendingDown },
    { id: "matrix", label: "Vessel Matrix", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingDown size={16} className="text-risk-low" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Total Risk Reduced</span>
          </div>
          <p className="font-mono text-2xl font-bold text-navy-900">-{totalRiskReduced}<span className="text-sm font-normal text-text-muted"> pts</span></p>
          <p className="mt-0.5 text-[10px] text-text-subtle">Across all 7 measures</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Activity size={16} className="text-blue-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Avg Reduction</span>
          </div>
          <p className="font-mono text-2xl font-bold text-navy-900">{avgReductionPct}<span className="text-sm font-normal text-text-muted">%</span></p>
          <p className="mt-0.5 text-[10px] text-text-subtle">Mean effectiveness</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Users size={16} className="text-blue-600" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Mandatory for {activeVesselClass}</span>
          </div>
          <p className="font-mono text-2xl font-bold text-navy-900">{mandatoryCoverage}</p>
          <p className="mt-0.5 text-[10px] text-text-subtle">Measures in effect</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {allAcked ? <CheckCircle2 size={16} className="text-risk-low" /> : <Circle size={16} className="text-text-subtle" />}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Acknowledged</span>
          </div>
          <p className="font-mono text-2xl font-bold text-navy-900">{ackedCount}<span className="text-sm font-normal text-text-muted">/{MITIGATIONS.length}</span></p>
          <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", riskBar(allAcked ? 100 : (ackedCount / MITIGATIONS.length) * 100))} style={{ width: `${(ackedCount / MITIGATIONS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5 no-print">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              activeTab === id ? "bg-navy-900 text-white shadow-xs" : "text-text-muted hover:bg-surface2 hover:text-navy-900"
            )}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MitigationImpactRadar selectedMitigationId={selectedMitigationId} onSelectMitigation={setSelectedMitigationId} />
          <MitigationRiskReductionPlot selectedMitigationId={selectedMitigationId} onSelectMitigation={setSelectedMitigationId} />
        </div>
      )}

      {activeTab === "radar" && (
        <MitigationImpactRadar selectedMitigationId={selectedMitigationId} onSelectMitigation={setSelectedMitigationId} />
      )}

      {activeTab === "reduction" && (
        <MitigationRiskReductionPlot selectedMitigationId={selectedMitigationId} onSelectMitigation={setSelectedMitigationId} />
      )}

      {activeTab === "matrix" && (
        <MitigationHeatmap selectedMitigationId={selectedMitigationId} onSelectMitigation={setSelectedMitigationId} />
      )}

      {/* Click-to-inspect mini panel */}
      {selectedMitigationId && (
        <SelectedMeasureDetail mitigationId={selectedMitigationId} onClose={() => setSelectedMitigationId(null)} />
      )}
    </div>
  );
}

function SelectedMeasureDetail({ mitigationId, onClose }: { mitigationId: string; onClose: () => void }) {
  const sop = MITIGATION_SOPS_MAP[mitigationId];
  if (!sop) return null;

  const dims = sop.impactDimensions;
  const dimEntries = Object.entries(dims);

  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50/30 p-5 shadow-xs animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-navy-900">{sop.title} — Detailed Breakdown</h4>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-navy-900">✕</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {dimEntries.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-border bg-surface p-3 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">{key}</p>
            <p className="mt-1 font-mono text-xl font-bold text-navy-900">{value as number}</p>
            <p className="text-[9px] text-text-subtle">score</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-border bg-surface p-3">
        <p className="text-xs font-semibold text-navy-900">Risk Reduction Impact</p>
        <p className="mt-1 text-xs text-text-muted">{sop.riskReduction.targetMetric} · {sop.riskReduction.percentageReduction} · {sop.riskReduction.confidence}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sop.riskReduction.coBenefits.map((b, i) => (
          <span key={i} className="rounded bg-risk-low-bg border border-risk-low/20 px-2 py-0.5 text-[10px] font-mono text-risk-low">+ {b}</span>
        ))}
      </div>
    </div>
  );
}
