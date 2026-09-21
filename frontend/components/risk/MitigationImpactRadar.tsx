"use client";

import { useState } from "react";
import { MITIGATION_SOPS_MAP } from "@/lib/riskDetailData";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  mandatory: "#c0392b",
  recommended: "#d4910a",
  advisory: "#6b7280",
};

const DIM_LABELS: Record<string, string> = {
  riskReduction: "Risk Reduction",
  confidence: "Confidence",
  costEfficiency: "Cost Efficiency",
  implementationSpeed: "Implementation",
  vesselCoverage: "Vessel Coverage",
  fleetReadiness: "Fleet Readiness",
};

const DIM_KEYS = ["riskReduction", "confidence", "costEfficiency", "implementationSpeed", "vesselCoverage", "fleetReadiness"] as const;
type DimKey = typeof DIM_KEYS[number];

interface MitigationImpactRadarProps {
  selectedMitigationId: string | null;
  onSelectMitigation: (id: string | null) => void;
}

export function MitigationImpactRadar({ selectedMitigationId, onSelectMitigation }: MitigationImpactRadarProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const mitigations = Object.values(MITIGATION_SOPS_MAP);
  const K = DIM_KEYS.length;
  const CX = 280;
  const CY = 250;
  const R_MAX = 140;

  const angles = Array.from({ length: K }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / K);

  const getPoint = (value: number, angle: number, r: number) => ({
    x: CX + r * (value / 100) * Math.cos(angle),
    y: CY + r * (value / 100) * Math.sin(angle),
  });

  const polygonPath = (values: Record<string, number>) => {
    const points = DIM_KEYS.map((key, i) => {
      const p = getPoint(values[key], angles[i], R_MAX);
      return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    });
    return `${points.join(" ")} Z`;
  };

  const selectedSop = selectedMitigationId ? MITIGATION_SOPS_MAP[selectedMitigationId] : null;

  return (
    <div className="relative w-full rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Mitigation Impact Matrix</h3>
          <p className="text-xs text-text-muted">Multi-dimensional effectiveness across 6 tactical axes · Click a mitigation to focus</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="h-2 w-5 rounded-xs bg-risk-high" /> Mandatory
          <span className="h-2 w-5 rounded-xs bg-risk-med" /> Recommended
          <span className="h-2 w-5 rounded-xs bg-gray-400" /> Advisory
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 560 500" className="h-auto w-full max-w-[520px] select-none">
          {/* Concentric grid rings */}
          {[0.25, 0.5, 0.75, 1.0].map((lvl) => {
            const pts = DIM_KEYS.map((_, i) => {
              const angle = angles[i];
              const r = R_MAX * lvl;
              return `${i === 0 ? "M" : "L"} ${(CX + r * Math.cos(angle)).toFixed(1)},${(CY + r * Math.sin(angle)).toFixed(1)}`;
            }).join(" ") + " Z";
            return (
              <path key={lvl} d={pts} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.6" />
            );
          })}

          {/* Radial spokes */}
          {DIM_KEYS.map((_, i) => {
            const x2 = CX + R_MAX * Math.cos(angles[i]);
            const y2 = CY + R_MAX * Math.sin(angles[i]);
            return (
              <line key={i} x1={CX} y1={CY} x2={x2} y2={y2} stroke="var(--color-border-strong)" strokeWidth="1" strokeOpacity="0.5" />
            );
          })}

          {/* Axis labels */}
          {DIM_KEYS.map((key, i) => {
            const labelR = R_MAX + 32;
            const lx = CX + labelR * Math.cos(angles[i]);
            const ly = CY + labelR * Math.sin(angles[i]);
            let anchor: "start" | "middle" | "end" = "middle";
            if (Math.cos(angles[i]) > 0.3) anchor = "start";
            else if (Math.cos(angles[i]) < -0.3) anchor = "end";
            return (
              <text key={`label-${key}`} x={lx} y={ly - 4} textAnchor={anchor} fontSize="10" fontWeight="bold" fill="var(--color-navy-900)">
                {DIM_LABELS[key]}
              </text>
            );
          })}

          {/* Mitigation polygons */}
          {mitigations.map((m, idx) => {
            const isSelected = selectedMitigationId === m.id;
            const isHovered = hoveredIdx === idx;
            const color = STATUS_COLORS[m.status] || "#6b7280";
            const dims = m.impactDimensions;

            const path = polygonPath(dims);

            return (
              <g
                key={m.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectMitigation(isSelected ? null : m.id)}
              >
                <path
                  d={path}
                  fill={color}
                  fillOpacity={isSelected ? 0.3 : isHovered ? 0.2 : 0.06}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                  strokeOpacity={isSelected ? 1 : isHovered ? 0.9 : 0.5}
                  strokeDasharray={m.status === "mandatory" ? undefined : "3 2"}
                  className="transition-all duration-200"
                />

                {DIM_KEYS.map((key, di) => {
                  const pt = getPoint(dims[key], angles[di], R_MAX);
                  return (
                    <circle
                      key={`${m.id}-${di}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 4 : isHovered ? 3.5 : 2.5}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  );
                })}

                {(() => {
                  const firstPt = getPoint(dims[DIM_KEYS[0]], angles[0], R_MAX);
                  const labelR = R_MAX + 48;
                  const lx = CX + labelR * Math.cos(angles[0]);
                  const ly = CY + labelR * Math.sin(angles[0]);
                  return (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight={isSelected ? "bold" : "normal"}
                      fill={color}
                      opacity={isSelected || isHovered ? 1 : 0.7}
                    >
                      {m.id.toUpperCase()}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {selectedSop && (
            <g>
              <rect x="10" y="10" width="240" height="80" rx="6" fill="#0a1930" fillOpacity="0.9" stroke={STATUS_COLORS[selectedSop.status]} strokeWidth="1.5" />
              <text x="20" y="28" fontSize="11" fontWeight="bold" fill="#ffffff">{selectedSop.title}</text>
              <text x="20" y="42" fontSize="9" fill="#9ab5cc">Status: <tspan fill={STATUS_COLORS[selectedSop.status]}>{selectedSop.status}</tspan></text>
              <text x="20" y="56" fontSize="9" fill="#9ab5cc">Category: <tspan fill="#ffffff">{selectedSop.category}</tspan></text>
              <text x="20" y="70" fontSize="9" fill="#9ab5cc">Risk Reduction: <tspan fill="#f87171">{selectedSop.riskReduction.percentageReduction}</tspan></text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
