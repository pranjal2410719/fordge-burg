"use client";

import { useState } from "react";
import { MITIGATION_SOPS_MAP } from "@/lib/riskDetailData";
import { cn, riskBadge } from "@/lib/utils";
import { TrendingDown } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  mandatory: "#c0392b",
  recommended: "#d4910a",
  advisory: "#6b7280",
};

interface MitigationRiskReductionPlotProps {
  selectedMitigationId: string | null;
  onSelectMitigation: (id: string | null) => void;
}

export function MitigationRiskReductionPlot({ selectedMitigationId, onSelectMitigation }: MitigationRiskReductionPlotProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const mitigations = Object.values(MITIGATION_SOPS_MAP);

  // Layout constants
  const M_LEFT = 180;
  const M_RIGHT = 80;
  const M_TOP = 20;
  const M_BOTTOM = 20;
  const PLOT_W = 600 - M_LEFT - M_RIGHT; // 340
  const ROW_H = 36;
  const PLOT_H = mitigations.length * ROW_H;
  const TOTAL_H = PLOT_H + M_TOP + M_BOTTOM;
  const SCALE_X = PLOT_W / 60; // 5.67px per risk point

  return (
    <div className="relative w-full rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Risk Reduction Impact by Measure</h3>
          <p className="text-xs text-text-muted">Risk score delta per mitigation · Larger bar = greater impact</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <TrendingDown size={12} className="text-risk-low" />
          <span>Risk pts eliminated</span>
        </div>
      </div>

      <div className="mt-3 w-full overflow-hidden">
        <svg viewBox={`0 0 600 ${TOTAL_H}`} className="h-auto w-full select-none">
          {/* Zero line */}
          <line
            x1={M_LEFT} y1={M_TOP + PLOT_H / 2}
            x2={M_LEFT + PLOT_W} y2={M_TOP + PLOT_H / 2}
            stroke="var(--color-border-strong)" strokeWidth="1"
          />

          {/* X-axis scale markers */}
          {[0, 10, 20, 30, 40, 50, 60].map((val) => {
            const x = M_LEFT + val * SCALE_X;
            return (
              <g key={val}>
                <line x1={x} y1={M_TOP + PLOT_H / 2 - 3} x2={x} y2={M_TOP + PLOT_H / 2 + 3} stroke="var(--color-border)" strokeWidth="1" />
                <text x={x} y={M_TOP + PLOT_H / 2 + 14} textAnchor="middle" fontSize="9" fontFamily="monospace" fill="var(--color-text-subtle)">-{val}</text>
              </g>
            );
          })}

          {/* Rows */}
          {mitigations.map((m, idx) => {
            const rowY = M_TOP + idx * ROW_H;
            const isHovered = hoveredIdx === idx;
            const isSelected = selectedMitigationId === m.id;
            const color = STATUS_COLORS[m.status] || "#6b7280";
            const delta = Math.abs(m.riskReduction.riskScoreDelta);
            const barW = delta * SCALE_X;
            const midY = rowY + ROW_H / 2;

            return (
              <g
                key={m.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectMitigation(isSelected ? null : m.id)}
              >
                {/* Row highlight */}
                {isSelected && (
                  <rect x="0" y={rowY} width="600" height={ROW_H - 4} rx="4" fill={color} fillOpacity={0.06} stroke={color} strokeWidth="1" />
                )}

                {/* Mitigation name */}
                <text x={M_LEFT - 8} y={midY + 4} textAnchor="end" fontSize="10" fontWeight="bold" fill="var(--color-navy-900)">
                  {m.title.length > 22 ? m.title.slice(0, 20) + "…" : m.title}
                </text>

                {/* Status badge */}
                <text x={M_LEFT - 8} y={midY + 16} textAnchor="end" fontSize="8" fontFamily="monospace" fill={color}>
                  {m.status}
                </text>

                {/* Bar track */}
                <rect
                  x={M_LEFT + PLOT_W} y={rowY + 8}
                  width={2} height={ROW_H - 16}
                  rx="1" fill="var(--color-border)"
                />

                {/* Reduction bar (growing leftward from right) */}
                <rect
                  x={M_LEFT + PLOT_W - barW} y={rowY + 10}
                  width={barW} height={ROW_H - 20}
                  rx="3"
                  fill={color}
                  fillOpacity={isHovered || isSelected ? 0.9 : 0.55}
                  className="transition-all duration-300"
                />

                {/* Bar value */}
                <text
                  x={M_LEFT + PLOT_W - barW - 6}
                  y={midY + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill={color}
                >
                  -{delta}
                </text>

                {/* Confidence chip */}
                <text
                  x={M_LEFT + PLOT_W - barW - 6}
                  y={midY + 16}
                  textAnchor="end"
                  fontSize="8"
                  fontFamily="monospace"
                  fill="var(--color-text-subtle)"
                >
                  {m.riskReduction.confidence}
                </text>

                {/* Hover tooltip */}
                {isHovered && (
                  <g transform={`translate(${M_LEFT + PLOT_W + 8}, ${rowY})`}>
                    <rect width="200" height="55" rx="6" fill="#0a1930" fillOpacity="0.95" stroke="var(--color-border)" strokeWidth="1" />
                    <text x="8" y="16" fontSize="10" fontWeight="bold" fill="#ffffff">{m.title}</text>
                    <text x="8" y="30" fontSize="9" fill="#9ab5cc">Impact: -{delta} pts ({m.riskReduction.percentageReduction})</text>
                    <text x="8" y="44" fontSize="9" fill="#9ab5cc">Confidence: {m.riskReduction.confidence} · {m.riskReduction.targetMetric}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
