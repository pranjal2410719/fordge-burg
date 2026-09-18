"use client";

import { useState } from "react";
import type { RouteId } from "@/lib/data";
import { ROUTE_COLORS } from "@/components/map/SimpleMap";

export interface WaypointRiskPoint {
  id: string;
  name: string;
  lat: string;
  lon: string;
  distNm: number;
  iceConc: number;      // 0-10 tenths
  riskScore: number;    // 0-100 score
  besetmentRisk: number;// 0-100 score
  polarCodeLimitKn: number;
}

export const ROUTE_WAYPOINTS: Record<RouteId, WaypointRiskPoint[]> = {
  shortest: [
    { id: "wp-s1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, iceConc: 2, riskScore: 32, besetmentRisk: 25, polarCodeLimitKn: 12 },
    { id: "wp-s2", name: "Antarctic Sound Chokepoint", lat: "63.1°S", lon: "57.80°W", distNm: 125, iceConc: 8, riskScore: 88, besetmentRisk: 84, polarCodeLimitKn: 4 },
    { id: "wp-s3", name: "Erebus & Terror Gulf", lat: "63.5°S", lon: "57.50°W", distNm: 215, iceConc: 7, riskScore: 85, besetmentRisk: 80, polarCodeLimitKn: 5 },
    { id: "wp-s4", name: "Weddell Outpost Alpha", lat: "65.5°S", lon: "56.00°W", distNm: 412, iceConc: 5, riskScore: 71, besetmentRisk: 62, polarCodeLimitKn: 7 },
  ],
  safest: [
    { id: "wp-sf1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, iceConc: 1, riskScore: 16, besetmentRisk: 10, polarCodeLimitKn: 13 },
    { id: "wp-sf2", name: "West Bransfield Bypass", lat: "62.8°S", lon: "60.20°W", distNm: 115, iceConc: 2, riskScore: 22, besetmentRisk: 14, polarCodeLimitKn: 11 },
    { id: "wp-sf3", name: "Low Island Deep Channel", lat: "63.0°S", lon: "61.00°W", distNm: 195, iceConc: 1, riskScore: 18, besetmentRisk: 12, polarCodeLimitKn: 12 },
    { id: "wp-sf4", name: "Trinity Seaward Lead", lat: "64.5°S", lon: "59.50°W", distNm: 360, iceConc: 3, riskScore: 36, besetmentRisk: 28, polarCodeLimitKn: 9 },
    { id: "wp-sf5", name: "Weddell Outpost Approach", lat: "65.5°S", lon: "56.00°W", distNm: 528, iceConc: 2, riskScore: 20, besetmentRisk: 16, polarCodeLimitKn: 10 },
  ],
  fuel_efficient: [
    { id: "wp-fe1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, iceConc: 2, riskScore: 28, besetmentRisk: 20, polarCodeLimitKn: 12 },
    { id: "wp-fe2", name: "Prince Gustav Channel", lat: "63.5°S", lon: "58.20°W", distNm: 155, iceConc: 5, riskScore: 54, besetmentRisk: 46, polarCodeLimitKn: 8 },
    { id: "wp-fe3", name: "Larsen Ice Shelf Margin", lat: "64.2°S", lon: "57.00°W", distNm: 295, iceConc: 4, riskScore: 48, besetmentRisk: 42, polarCodeLimitKn: 8 },
    { id: "wp-fe4", name: "Weddell Outpost Alpha", lat: "65.5°S", lon: "56.00°W", distNm: 458, iceConc: 4, riskScore: 42, besetmentRisk: 34, polarCodeLimitKn: 9 },
  ],
  balanced: [
    { id: "wp-b1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, iceConc: 2, riskScore: 20, besetmentRisk: 15, polarCodeLimitKn: 12 },
    { id: "wp-b2", name: "South Shetland Strait", lat: "63.0°S", lon: "58.70°W", distNm: 85, iceConc: 3, riskScore: 28, besetmentRisk: 22, polarCodeLimitKn: 10 },
    { id: "wp-b3", name: "Joinville Island Passage", lat: "63.4°S", lon: "58.50°W", distNm: 145, iceConc: 4, riskScore: 42, besetmentRisk: 36, polarCodeLimitKn: 9 },
    { id: "wp-b4", name: "Prince Gustav Margin", lat: "64.2°S", lon: "57.50°W", distNm: 260, iceConc: 3, riskScore: 34, besetmentRisk: 28, polarCodeLimitKn: 9 },
    { id: "wp-b5", name: "Snow Hill Island Corridor", lat: "64.6°S", lon: "57.00°W", distNm: 340, iceConc: 3, riskScore: 32, besetmentRisk: 26, polarCodeLimitKn: 10 },
    { id: "wp-b6", name: "Weddell Outpost Alpha", lat: "65.5°S", lon: "56.00°W", distNm: 445, iceConc: 3, riskScore: 24, besetmentRisk: 18, polarCodeLimitKn: 11 },
  ],
};

interface WaypointRiskChartProps {
  routeId: RouteId;
}

export function WaypointRiskChart({ routeId }: WaypointRiskChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const waypoints = ROUTE_WAYPOINTS[routeId] || ROUTE_WAYPOINTS.balanced;
  const routeColor = ROUTE_COLORS[routeId] || "#1e6fd9";

  const totalDist = waypoints[waypoints.length - 1].distNm || 1;

  // Layout constants
  const M_LEFT = 55;
  const M_RIGHT = 25;
  const M_TOP = 30;
  const M_BOTTOM = 45;
  const PLOT_W = 800 - M_LEFT - M_RIGHT; // 720
  const PLOT_H = 280 - M_TOP - M_BOTTOM; // 205
  const BASE_Y = M_TOP + PLOT_H; // 235

  const points = waypoints.map((wp) => {
    const x = M_LEFT + (wp.distNm / totalDist) * PLOT_W;
    const y = BASE_Y - (wp.riskScore / 100) * PLOT_H;
    return { ...wp, x, y };
  });

  // SVG Area path & Line path
  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, "");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${BASE_Y} L ${points[0].x.toFixed(1)},${BASE_Y} Z`;

  // Risk thresholds
  const yHigh = BASE_Y - (65 / 100) * PLOT_H; // ~101.75
  const yMed = BASE_Y - (35 / 100) * PLOT_H;  // ~163.25

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Waypoint Risk Exposure Profile</h3>
          <p className="text-xs text-text-muted">
            Nautical distance progression vs risk score &amp; ice concentration
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-xs" style={{ backgroundColor: routeColor, opacity: 0.6 }} />
            <span>Risk Exposure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2 rounded-xs border border-[#7aafc8] bg-[#9ab5cc]/40" />
            <span>Ice Conc.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-b border-dashed border-risk-high" />
            <span className="text-risk-high">High (&gt;65)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-b border-dashed border-risk-med" />
            <span className="text-risk-med">Mod (&gt;35)</span>
          </div>
        </div>
      </div>

      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox="0 0 800 280"
          className="h-auto w-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={`areaGrad-${routeId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={routeColor} stopOpacity="0.38" />
              <stop offset="100%" stopColor={routeColor} stopOpacity="0.03" />
            </linearGradient>
            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid horizontal lines */}
          {[0, 25, 50, 75, 100].map((score) => {
            const y = BASE_Y - (score / 100) * PLOT_H;
            return (
              <g key={score}>
                <line
                  x1={M_LEFT}
                  y1={y}
                  x2={M_LEFT + PLOT_W}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  strokeDasharray={score === 0 ? "none" : "3 3"}
                  strokeOpacity="0.75"
                />
                <text
                  x={M_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="var(--color-text-subtle)"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Risk threshold reference lines */}
          <line
            x1={M_LEFT}
            y1={yHigh}
            x2={M_LEFT + PLOT_W}
            y2={yHigh}
            stroke="var(--color-risk-high)"
            strokeWidth="1"
            strokeDasharray="4 4"
            strokeOpacity="0.75"
          />
          <text
            x={M_LEFT + PLOT_W - 4}
            y={yHigh - 4}
            textAnchor="end"
            fontSize="9"
            fontWeight="bold"
            fill="var(--color-risk-high)"
          >
            CRITICAL THRESHOLD (65)
          </text>

          <line
            x1={M_LEFT}
            y1={yMed}
            x2={M_LEFT + PLOT_W}
            y2={yMed}
            stroke="var(--color-risk-med)"
            strokeWidth="1"
            strokeDasharray="4 4"
            strokeOpacity="0.75"
          />
          <text
            x={M_LEFT + PLOT_W - 4}
            y={yMed - 4}
            textAnchor="end"
            fontSize="9"
            fontWeight="bold"
            fill="var(--color-risk-med)"
          >
            MODERATE BOUNDARY (35)
          </text>

          {/* Dual Layer: Ice Concentration Columns */}
          {points.map((pt, i) => {
            const barW = 22;
            const barH = (pt.iceConc / 10) * (PLOT_H * 0.55);
            const barX = pt.x - barW / 2;
            const barY = BASE_Y - barH;
            return (
              <g key={`ice-${pt.id}`}>
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx="3"
                  fill="#9ab5cc"
                  fillOpacity="0.22"
                  stroke="#7aafc8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={pt.x}
                  y={BASE_Y - barH - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#5b7b99"
                >
                  {pt.iceConc}/10
                </text>
              </g>
            );
          })}

          {/* Risk Profile Area and Line */}
          <path d={areaPath} fill={`url(#areaGrad-${routeId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={routeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Waypoint markers and hover vertical guidelines */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={pt.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
              >
                {/* Vertical guideline */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={M_TOP}
                    x2={pt.x}
                    y2={BASE_Y}
                    stroke={routeColor}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Waypoint circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 5}
                  fill="#ffffff"
                  stroke={routeColor}
                  strokeWidth={isHovered ? 3 : 2}
                  filter={isHovered ? "url(#pointShadow)" : undefined}
                  className="transition-all duration-150"
                />

                {/* Score label badge */}
                <text
                  x={pt.x}
                  y={pt.y - (isHovered ? 12 : 9)}
                  textAnchor="middle"
                  fontSize={isHovered ? "11" : "10"}
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill={pt.riskScore >= 65 ? "var(--color-risk-high)" : pt.riskScore >= 35 ? "var(--color-risk-med)" : "var(--color-navy-900)"}
                >
                  {pt.riskScore}
                </text>

                {/* X-axis waypoint tick & label */}
                <line
                  x1={pt.x}
                  y1={BASE_Y}
                  x2={pt.x}
                  y2={BASE_Y + 5}
                  stroke="var(--color-border-strong)"
                  strokeWidth="1.5"
                />
                <text
                  x={pt.x}
                  y={BASE_Y + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="var(--color-navy-900)"
                >
                  {pt.distNm} NM
                </text>
                <text
                  x={pt.x}
                  y={BASE_Y + 28}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--color-text-subtle)"
                >
                  {pt.id.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Interactive Tooltip Card overlay */}
          {hoveredPoint && (
            <g transform={`translate(${Math.min(Math.max(hoveredPoint.x - 90, 10), 620)}, ${hoveredPoint.y > 120 ? hoveredPoint.y - 85 : hoveredPoint.y + 15})`}>
              <rect
                width="180"
                height="70"
                rx="6"
                fill="#0a1930"
                fillOpacity="0.95"
                stroke="var(--color-border)"
                strokeWidth="1"
                filter="url(#pointShadow)"
              />
              <text x="10" y="16" fontSize="10" fontWeight="bold" fill="#ffffff">
                {hoveredPoint.name}
              </text>
              <text x="10" y="30" fontSize="9" fontFamily="monospace" fill="#9ab5cc">
                {hoveredPoint.lat} · {hoveredPoint.lon} ({hoveredPoint.distNm} NM)
              </text>
              <text x="10" y="46" fontSize="9" fill="#dbeafe">
                Risk Score: <tspan fontWeight="bold" fill={hoveredPoint.riskScore >= 65 ? "#f87171" : "#fbbf24"}>{hoveredPoint.riskScore}/100</tspan>
              </text>
              <text x="10" y="60" fontSize="9" fill="#94a3b8">
                Ice: <tspan fill="#ffffff">{hoveredPoint.iceConc}/10</tspan> · Besetment: <tspan fill="#ffffff">{hoveredPoint.besetmentRisk}%</tspan>
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
