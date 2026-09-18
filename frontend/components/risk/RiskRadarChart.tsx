"use client";

import { useState } from "react";
import type { RouteId } from "@/lib/data";
import { ROUTE_COLORS } from "@/components/map/SimpleMap";

export interface RadarFactor {
  key: string;
  label: string;
  sub: string;
  unit: string;
  values: Record<RouteId, number>; // score 0-100
}

export const RADAR_FACTORS: RadarFactor[] = [
  { key: "besetment",  label: "Besetment",    sub: "Compressive pack",  unit: "%", values: { shortest: 84, safest: 18, fuel_efficient: 46, balanced: 30 } },
  { key: "delay",      label: "Transit Delay", sub: "ETA variance",     unit: "%", values: { shortest: 68, safest: 32, fuel_efficient: 44, balanced: 35 } },
  { key: "fuel",       label: "Fuel Burn",    sub: "Reserve margin",   unit: "%", values: { shortest: 72, safest: 35, fuel_efficient: 22, balanced: 32 } },
  { key: "disruption", label: "Disruption",   sub: "Forced detour",    unit: "%", values: { shortest: 76, safest: 20, fuel_efficient: 40, balanced: 28 } },
  { key: "pressure",   label: "Ice Pressure", sub: "Ridge convergence", unit: "%", values: { shortest: 82, safest: 24, fuel_efficient: 50, balanced: 36 } },
  { key: "hull",       label: "Hull Load",    sub: "Kinetic stress",   unit: "%", values: { shortest: 80, safest: 22, fuel_efficient: 48, balanced: 34 } },
];

export const VESSEL_THRESHOLDS: Record<string, number> = {
  PC2: 85,
  PC4: 70,
  PC5: 55,
  OpenWater: 30,
};

interface RiskRadarChartProps {
  routeId: RouteId;
  vesselIceClass: string;
}

export function RiskRadarChart({ routeId, vesselIceClass }: RiskRadarChartProps) {
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  const routeColor = ROUTE_COLORS[routeId] || "#1e6fd9";
  const vesselThreshold = VESSEL_THRESHOLDS[vesselIceClass] ?? 70;

  const CX = 230;
  const CY = 205;
  const R_MAX = 140;
  const K = 6;

  // Angles: top vertical is -pi/2
  const angles = Array.from({ length: K }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / K);

  // Concentric hex rings at scale levels
  const ringLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getPolygonPath = (radius: number) => {
    return angles
      .map((theta, i) => {
        const x = CX + radius * Math.cos(theta);
        const y = CY + radius * Math.sin(theta);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .concat("Z")
      .join(" ");
  };

  // Vessel capability polygon
  const vesselEnvelopePath = getPolygonPath(R_MAX * (vesselThreshold / 100));

  // Active route polygon
  const routeVertices = RADAR_FACTORS.map((factor, i) => {
    const score = factor.values[routeId] ?? 40;
    const r = R_MAX * (score / 100);
    const x = CX + r * Math.cos(angles[i]);
    const y = CY + r * Math.sin(angles[i]);
    const isBreach = score > vesselThreshold;
    return { ...factor, score, x, y, theta: angles[i], isBreach };
  });

  const routePolygonPath = routeVertices
    .map((v, i) => `${i === 0 ? "M" : "L"} ${v.x.toFixed(1)},${v.y.toFixed(1)}`)
    .concat("Z")
    .join(" ");

  const hasBreaches = routeVertices.some((v) => v.isBreach);

  return (
    <div className="relative w-full rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Multi-Factor Risk Radar</h3>
          <p className="text-xs text-text-muted">
            360° Assessment across 6 tactical polar factors vs hull envelope
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-xs" style={{ backgroundColor: routeColor }} />
            <span>Route Profile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-b-2 border-dashed border-[#5b6b7f]" />
            <span>Hull Limit ({vesselIceClass})</span>
          </div>
          {hasBreaches && (
            <span className="rounded bg-risk-high-bg px-1.5 py-0.5 text-[10px] font-bold text-risk-high border border-risk-high/30">
              Envelope Exceeded
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 460 420"
          className="h-auto w-full max-w-[440px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id={`radarGrad-${routeId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={routeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={routeColor} stopOpacity="0.08" />
            </radialGradient>
          </defs>

          {/* Concentric safety grid rings */}
          {ringLevels.map((lvl) => {
            const path = getPolygonPath(R_MAX * lvl);
            return (
              <path
                key={lvl}
                d={path}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />
            );
          })}

          {/* Critical Risk Threshold ring (65) */}
          <path
            d={getPolygonPath(R_MAX * 0.65)}
            fill="none"
            stroke="var(--color-risk-high)"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.5"
          />

          {/* Radial Spokes */}
          {angles.map((theta, i) => {
            const x2 = CX + R_MAX * Math.cos(theta);
            const y2 = CY + R_MAX * Math.sin(theta);
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={x2}
                y2={y2}
                stroke="var(--color-border-strong)"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
            );
          })}

          {/* Dynamic Vessel Capability Envelope */}
          <path
            d={vesselEnvelopePath}
            fill="none"
            stroke="#5b6b7f"
            strokeWidth="1.75"
            strokeDasharray="5 3"
          />

          {/* Route Data Polygon */}
          <path
            d={routePolygonPath}
            fill={`url(#radarGrad-${routeId})`}
            stroke={routeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Axis Labels and Interactive Anchors */}
          {routeVertices.map((v, i) => {
            const isHovered = hoveredAxis === i;
            const labelR = R_MAX + 36;
            const labelX = CX + labelR * Math.cos(v.theta);
            const labelY = CY + labelR * Math.sin(v.theta);

            // Determine text anchor based on angle
            let textAnchor: "start" | "middle" | "end" = "middle";
            if (Math.cos(v.theta) > 0.3) textAnchor = "start";
            else if (Math.cos(v.theta) < -0.3) textAnchor = "end";

            return (
              <g
                key={v.key}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
                onClick={() => setHoveredAxis(hoveredAxis === i ? null : i)}
              >
                {/* Vertex circle */}
                <circle
                  cx={v.x}
                  cy={v.y}
                  r={isHovered ? 7 : 4.5}
                  fill={v.isBreach ? "var(--color-risk-high)" : "#ffffff"}
                  stroke={v.isBreach ? "#ffffff" : routeColor}
                  strokeWidth={2}
                  className="transition-all duration-150"
                />

                {/* Outer text label */}
                <text
                  x={labelX}
                  y={labelY - 5}
                  textAnchor={textAnchor}
                  fontSize="11"
                  fontWeight="bold"
                  fill="var(--color-navy-900)"
                >
                  {v.label}
                </text>
                <text
                  x={labelX}
                  y={labelY + 8}
                  textAnchor={textAnchor}
                  fontSize="9"
                  fontFamily="monospace"
                  fill={v.score >= 65 ? "var(--color-risk-high)" : "var(--color-text-subtle)"}
                >
                  {v.score}{v.unit} {v.isBreach && "⚠️"}
                </text>
              </g>
            );
          })}

          {/* Center Hub */}
          <circle cx={CX} cy={CY} r="3" fill="var(--color-navy-900)" />

          {/* Tooltip Overlay */}
          {hoveredAxis !== null && (
            <g transform={`translate(${CX - 90}, ${CY - 40})`}>
              <rect
                width="180"
                height="65"
                rx="6"
                fill="#0a1930"
                fillOpacity="0.95"
                stroke="var(--color-border)"
                strokeWidth="1"
              />
              <text x="10" y="18" fontSize="11" fontWeight="bold" fill="#ffffff">
                {routeVertices[hoveredAxis].label}
              </text>
              <text x="10" y="32" fontSize="9" fill="#9ab5cc">
                {routeVertices[hoveredAxis].sub}
              </text>
              <text x="10" y="48" fontSize="10" fill="#dbeafe">
                Score: <tspan fontWeight="bold" fill={routeVertices[hoveredAxis].score > vesselThreshold ? "#f87171" : "#4ade80"}>{routeVertices[hoveredAxis].score}%</tspan>
                {" "}(Hull Limit: {vesselThreshold}%)
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
