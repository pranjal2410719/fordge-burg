"use client";

import { useState } from "react";
import { MITIGATION_SOPS_MAP } from "@/lib/riskDetailData";
import { cn } from "@/lib/utils";

const VESSEL_CLASSES = ["OpenWater", "PC5", "PC4", "PC2"];
const CLASS_LABELS: Record<string, string> = { OpenWater: "OpenWater", PC5: "Polar PC5", PC4: "Polar PC4", PC2: "Polar PC2" };

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Mandatory:  { bg: "bg-risk-high", text: "text-white", border: "border-risk-high/30", label: "Mandatory" },
  Recommended:{ bg: "bg-risk-med", text: "text-white", border: "border-risk-med/30", label: "Recommended" },
  Advisory:   { bg: "bg-surface2", text: "text-text-muted", border: "border-border", label: "Advisory" },
  Exempt:     { bg: "bg-risk-low-bg", text: "text-risk-low", border: "border-risk-low/30", label: "Exempt" },
};

const VIEW_MODES = ["status", "coverage"] as const;

interface MitigationHeatmapProps {
  selectedMitigationId: string | null;
  onSelectMitigation: (id: string | null) => void;
}

export function MitigationHeatmap({ selectedMitigationId, onSelectMitigation }: MitigationHeatmapProps) {
  const [viewMode, setViewMode] = useState<"status" | "coverage">("status");
  const [hoveredCell, setHoveredCell] = useState<{ mIdx: number; cIdx: number } | null>(null);

  const mitigations = Object.values(MITIGATION_SOPS_MAP);

  const cellColor = (appIdx: number, cIdx: number) => {
    const app = mitigations[appIdx].applicability[cIdx];
    if (!app) return "transparent";
    if (viewMode === "status") {
      const style = STATUS_STYLES[app.status];
      return style ? style.bg : "transparent";
    }
    // Coverage mode: based on riskReduction impact
    const coverageScore = mitigations[appIdx].impactDimensions.vesselCoverage;
    if (app.status === "Mandatory") return "#c0392b";
    if (app.status === "Recommended") return "#d4910a";
    if (app.status === "Advisory") return "#9ca3af";
    if (app.status === "Exempt") return "#1e8449";
    return "transparent";
  };

  const cellOpacity = (appIdx: number, cIdx: number) => {
    const app = mitigations[appIdx].applicability[cIdx];
    if (!app) return 0;
    if (viewMode === "coverage") {
      return app.status === "Mandatory" ? 1 : app.status === "Recommended" ? 0.8 : app.status === "Advisory" ? 0.5 : 0.3;
    }
    return 0.25;
  };

  return (
    <div className="relative w-full rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Vessel-Class Applicability Matrix</h3>
          <p className="text-xs text-text-muted">Mitigation coverage across hull classes</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {VIEW_MODES.map((mode) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer",
                  active ? "bg-navy-900 text-white shadow-xs" : "text-text-muted hover:bg-surface2"
                )}
              >
                {mode === "status" ? "Status" : "Coverage"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 w-full overflow-hidden">
        <svg viewBox="0 0 620 380" className="h-auto w-full select-none">
          {/* Column headers */}
          {VESSEL_CLASSES.map((cls, ci) => {
            const x = 160 + ci * 105;
            return (
              <g key={cls}>
                <rect x={x} y="5" width="95" height="22" rx="4" fill="var(--color-navy-900)" />
                <text x={x + 47.5} y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">
                  {CLASS_LABELS[cls]}
                </text>
              </g>
            );
          })}

          {/* Rows */}
          {mitigations.map((m, mi) => {
            const rowY = 35 + mi * 42;
            const isSelected = selectedMitigationId === m.id;
            const color = m.status === "mandatory" ? "#c0392b" : m.status === "recommended" ? "#d4910a" : "#6b7280";

            return (
              <g key={m.id}>
                {/* Row label */}
                <text x="10" y={rowY + 16} fontSize="10" fontWeight="bold" fill="var(--color-navy-900)">
                  {m.title.length > 20 ? m.title.slice(0, 18) + "…" : m.title}
                </text>
                <text x="10" y={rowY + 28} fontSize="8" fontFamily="monospace" fill={color}>{m.id.toUpperCase()}</text>

                {/* Cells */}
                {VESSEL_CLASSES.map((cls, ci) => {
                  const app = m.applicability[ci];
                  if (!app) return null;
                  const x = 160 + ci * 105;
                  const isHovered = hoveredCell?.mIdx === mi && hoveredCell?.cIdx === ci;
                  const isSelected = selectedMitigationId === m.id;

                  return (
                    <g
                      key={cls}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredCell({ mIdx: mi, cIdx: ci })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => onSelectMitigation(isSelected ? null : m.id)}
                    >
                      <rect
                        x={x} y={rowY}
                        width="95" height="36"
                        rx="4"
                        fill={cellColor(mi, ci)}
                        fillOpacity={isHovered || isSelected ? 0.9 : cellOpacity(mi, ci)}
                        stroke={isSelected ? "#3b82f6" : isHovered ? "#6b7280" : "var(--color-border)"}
                        strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.5}
                        className="transition-all duration-200"
                      />
                      {/* Status text */}
                      <text x={x + 47.5} y={rowY + 15} textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-navy-900)">
                        {app.status}
                      </text>
                      <text x={x + 47.5} y={rowY + 28} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="var(--color-text-subtle)">
                        {app.operationalLimits.slice(0, 18)}…
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredCell && (() => {
            const m = mitigations[hoveredCell.mIdx];
            const app = m.applicability[hoveredCell.cIdx];
            const x = 160 + hoveredCell.cIdx * 105;
            const rowY = 35 + hoveredCell.mIdx * 42;
            return (
              <g transform={`translate(${x + 98}, ${rowY})`}>
                <rect width="180" height="70" rx="6" fill="#0a1930" fillOpacity="0.95" stroke="var(--color-border)" strokeWidth="1" />
                <text x="8" y="16" fontSize="10" fontWeight="bold" fill="#ffffff">{app.status}</text>
                <text x="8" y="30" fontSize="9" fill="#9ab5cc">Guidance: {app.guidance}</text>
                <text x="8" y="44" fontSize="9" fill="#9ab5cc">Limits: {app.operationalLimits}</text>
                <text x="8" y="58" fontSize="9" fill="#dbeafe">Class: {app.class}</text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
