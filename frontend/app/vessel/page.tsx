"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useMission } from "@/components/session/MissionContext";
import { VESSELS } from "@/lib/data";
import { cn, riskBadge, riskBar } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface CapabilityRow {
  label: string;
  pc2: "yes" | "no" | "limited";
  pc4: "yes" | "no" | "limited";
  pc5: "yes" | "no" | "limited";
  ow: "yes" | "no" | "limited";
}

const CAPABILITY_MATRIX: CapabilityRow[] = [
  { label: "Multi-year ice transit",         pc2: "yes",     pc4: "limited", pc5: "no",      ow: "no" },
  { label: "Pressure ridge navigation",      pc2: "yes",     pc4: "limited", pc5: "no",      ow: "no" },
  { label: "First-year ice transit",         pc2: "yes",     pc4: "yes",     pc5: "yes",     ow: "no" },
  { label: "Fast ice edge operations",       pc2: "yes",     pc4: "yes",     pc5: "limited", ow: "no" },
  { label: "Open-water operations",          pc2: "yes",     pc4: "yes",     pc5: "yes",     ow: "yes" },
  { label: "Drift field transit",            pc2: "yes",     pc4: "yes",     pc5: "limited", ow: "limited" },
  { label: "Low-concentration pack ice",     pc2: "yes",     pc4: "yes",     pc5: "yes",     ow: "limited" },
  { label: "High-concentration pack ice",    pc2: "yes",     pc4: "limited", pc5: "no",      ow: "no" },
];

const CAP_ICON: Record<"yes"|"no"|"limited", React.ElementType> = {
  yes:     CheckCircle2,
  no:      XCircle,
  limited: MinusCircle,
};
const CAP_STYLE: Record<"yes"|"no"|"limited", string> = {
  yes:     "text-risk-low",
  no:      "text-risk-high",
  limited: "text-risk-med",
};

const CLASS_COL: Record<string, keyof CapabilityRow> = {
  PC2:       "pc2",
  PC4:       "pc4",
  PC5:       "pc5",
  OpenWater: "ow",
};

// Simple RIO calculation approximation
function computeRIO(iceClass: string): { score: number; status: string; color: string } {
  if (iceClass === "PC2") return { score: 12,  status: "Normal Operation",     color: "text-risk-low" };
  if (iceClass === "PC4") return { score: 5,   status: "Normal Operation",     color: "text-risk-low" };
  if (iceClass === "PC5") return { score: -6,  status: "Elevated Risk",        color: "text-risk-med" };
  return              { score: -18, status: "Restricted Operation", color: "text-risk-high" };
}

export default function VesselPage() {
  const { vessel, setVesselId } = useMission();
  const rio = computeRIO(vessel.iceClass);
  const capCol = CLASS_COL[vessel.iceClass] ?? "ow";

  return (
    <AppShell>
      <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Vessel Intelligence</h1>
        <p className="mt-0.5 text-sm text-text-muted">5 polar vessel profiles · POLARIS RIO evaluation · capability matrix</p>
      </div>

      {/* Vessel selector */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {VESSELS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVesselId(v.id)}
            className={cn(
              "rounded-xl border p-3 text-left transition-all",
              vessel.id === v.id
                ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                : "border-border bg-surface hover:border-border-strong hover:bg-surface2"
            )}
          >
            <span className={cn(
              "inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold mb-1.5",
              v.iceClass === "PC2" ? "border-blue-300 bg-blue-50 text-blue-700" :
              v.iceClass === "PC4" ? "border-risk-low/40 bg-risk-low-bg text-risk-low" :
              v.iceClass === "PC5" ? "border-risk-med/40 bg-risk-med-bg text-risk-med" :
              "border-risk-high/40 bg-risk-high-bg text-risk-high"
            )}>
              {v.iceClass}
            </span>
            <p className="text-xs font-semibold text-navy-900 leading-snug">{v.name}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Vessel specifications */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900 mb-4">Vessel Profile</h2>
          <p className="text-lg font-bold text-navy-900">{vessel.name}</p>
          <span className={cn(
            "mt-1 inline-block rounded border px-2 py-0.5 font-mono text-xs font-bold",
            vessel.iceClass === "PC2" ? "border-blue-300 bg-blue-50 text-blue-700" :
            vessel.iceClass === "PC4" ? "border-risk-low/40 bg-risk-low-bg text-risk-low" :
            vessel.iceClass === "PC5" ? "border-risk-med/40 bg-risk-med-bg text-risk-med" :
            "border-risk-high/40 bg-risk-high-bg text-risk-high"
          )}>
            {vessel.iceClass}
          </span>

          <dl className="mt-4 space-y-3">
            {[
              ["LOA",           `${vessel.loaM} m`],
              ["Beam",          `${vessel.beamM} m`],
              ["Draft",         `${vessel.draftM} m`],
              ["Open-water spd",`${vessel.openWaterKn} kn`],
              ["Ice speed limit",`${vessel.iceLimitKn} kn`],
              ["Fuel consumption",`${vessel.fuelTonsPerDay} MT/day`],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                <dt className="text-xs text-text-muted">{k}</dt>
                <dd className="font-mono text-xs font-semibold text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* POLARIS RIO */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900 mb-1">POLARIS RIO Evaluation</h2>
          <p className="text-xs text-text-muted mb-4">IMO Polar Code Risk Index Outcome</p>

          <div className={cn("rounded-xl border-2 p-5 text-center mb-4",
            rio.score >= 0 ? "border-risk-low/40 bg-risk-low-bg" :
            rio.score >= -10 ? "border-risk-med/40 bg-risk-med-bg" :
            "border-risk-high/40 bg-risk-high-bg"
          )}>
            <p className="font-mono text-4xl font-bold text-navy-900">{rio.score > 0 ? `+${rio.score}` : rio.score}</p>
            <p className={cn("mt-1 text-sm font-semibold", rio.color)}>{rio.status}</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { label: "RIO ≥ 0",    status: "Normal Operation",     desc: "Authorized, standard speed" },
              { label: "RIO ≥ −10",  status: "Elevated Risk",        desc: "Speed throttle ×0.75, daylight advised" },
              { label: "RIO < −10",  status: "Restricted Operation", desc: "Icebreaker escort, ≤ 2.5 kn" },
            ].map(({ label, status, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="shrink-0 font-mono text-[10px] text-text-muted w-16 pt-0.5">{label}</span>
                <div>
                  <p className="font-semibold text-navy-900">{status}</p>
                  <p className="text-text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capability matrix */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-navy-900">Capability Matrix</h2>
            <p className="text-xs text-text-muted mt-0.5">Selected vessel column highlighted</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface2 text-left">
                  <th className="px-3 py-2.5 text-text-muted font-semibold">Condition</th>
                  {["PC2","PC4","PC5","OW"].map((h, i) => {
                    const cls = ["PC2","PC4","PC5","OpenWater"][i];
                    return (
                      <th key={h} className={cn("px-3 py-2.5 font-semibold text-center", vessel.iceClass === cls ? "text-blue-600" : "text-text-muted")}>
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {CAPABILITY_MATRIX.map((row, i) => (
                  <tr key={row.label} className={cn("border-b border-border", i % 2 === 1 ? "bg-surface2" : "")}>
                    <td className="px-3 py-2.5 text-text-secondary leading-tight">{row.label}</td>
                    {(["pc2","pc4","pc5","ow"] as const).map((col) => {
                      const val = row[col];
                      const Icon = CAP_ICON[val];
                      const isActive = col === capCol;
                      return (
                        <td key={col} className={cn("px-3 py-2.5 text-center", isActive ? "bg-blue-50" : "")}>
                          <Icon size={14} className={cn("mx-auto", CAP_STYLE[val])} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 px-3 py-2 border-t border-border bg-surface2">
            <div className="flex items-center gap-1 text-[10px] text-risk-low"><CheckCircle2 size={10} /> Capable</div>
            <div className="flex items-center gap-1 text-[10px] text-risk-med"><MinusCircle size={10} /> Limited</div>
            <div className="flex items-center gap-1 text-[10px] text-risk-high"><XCircle size={10} /> Not capable</div>
          </div>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
