"use client";

import { BASELINE_ROUTES, type RouteAlternative, type RouteId } from "@/lib/data";
import { ROUTE_COLORS } from "@/components/map/SimpleMap";
import { cn } from "@/lib/utils";

interface RouteRiskComparisonProps {
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  routes?: RouteAlternative[];
}

export function RouteRiskComparison({
  selectedRouteId,
  onSelectRoute,
  routes = BASELINE_ROUTES,
}: RouteRiskComparisonProps) {
  // Layout Constants
  // ViewBox: 0 0 760 250
  const TRACK_X = 185;
  const TRACK_W = 440;
  const SCALE = TRACK_W / 100; // 4.40px per score point

  return (
    <div className="relative w-full rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Route Alternatives Risk Comparison</h3>
          <p className="text-xs text-text-muted">
            Range-bullet analysis: Average Risk vs Worst-Case Peak Risk · Click any route to select
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-navy-900" />
            <span>Average Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs border border-dashed border-navy-700 bg-navy-700/20" />
            <span>Peak Risk Spread</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-1 bg-risk-high rounded-full" />
            <span>Max Needle</span>
          </div>
        </div>
      </div>

      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox="0 0 760 250"
          className="h-auto w-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Axis Header & Scale Markers */}
          <g>
            {/* Low Risk Zone */}
            <rect
              x={TRACK_X}
              y={10}
              width={35 * SCALE}
              height={14}
              rx="2"
              fill="var(--color-risk-low)"
              fillOpacity="0.12"
            />
            <text
              x={TRACK_X + (35 * SCALE) / 2}
              y={21}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="var(--color-risk-low)"
            >
              LOW RISK (0–35)
            </text>

            {/* Moderate Risk Zone */}
            <rect
              x={TRACK_X + 35 * SCALE}
              y={10}
              width={30 * SCALE}
              height={14}
              rx="2"
              fill="var(--color-risk-med)"
              fillOpacity="0.12"
            />
            <text
              x={TRACK_X + 50 * SCALE}
              y={21}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="var(--color-risk-med)"
            >
              MODERATE (35–65)
            </text>

            {/* High Risk Zone */}
            <rect
              x={TRACK_X + 65 * SCALE}
              y={10}
              width={35 * SCALE}
              height={14}
              rx="2"
              fill="var(--color-risk-high)"
              fillOpacity="0.12"
            />
            <text
              x={TRACK_X + 82.5 * SCALE}
              y={21}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="var(--color-risk-high)"
            >
              HIGH RISK (65–100)
            </text>
          </g>

          {/* 4 Route Rows */}
          {routes.map((route, i) => {
            const isSelected = route.id === selectedRouteId;
            const routeColor = ROUTE_COLORS[route.id] || "#1e6fd9";
            const rowY = 36 + i * 52;

            const avgW = route.averageRiskScore * SCALE;
            const spreadX = TRACK_X + avgW;
            const spreadW = Math.max((route.maxRiskScore - route.averageRiskScore) * SCALE, 0);
            const maxX = TRACK_X + route.maxRiskScore * SCALE;

            return (
              <g
                key={route.id}
                className="cursor-pointer transition-all"
                onClick={() => onSelectRoute(route.id)}
              >
                {/* Row background highlight when selected */}
                {isSelected && (
                  <rect
                    x="5"
                    y={rowY}
                    width="750"
                    height="46"
                    rx="8"
                    fill={routeColor}
                    fillOpacity="0.08"
                    stroke={routeColor}
                    strokeWidth="1.5"
                  />
                )}

                {/* Radio selection circle */}
                <circle
                  cx="20"
                  cy={rowY + 23}
                  r="7"
                  fill={isSelected ? routeColor : "#ffffff"}
                  stroke={isSelected ? routeColor : "var(--color-border-strong)"}
                  strokeWidth="2"
                />
                {isSelected && (
                  <circle cx="20" cy={rowY + 23} r="3" fill="#ffffff" />
                )}

                {/* Route Header Info */}
                <text
                  x="36"
                  y={rowY + 18}
                  fontSize="12"
                  fontWeight="bold"
                  fill="var(--color-navy-900)"
                >
                  {route.name}
                </text>
                <text
                  x="36"
                  y={rowY + 33}
                  fontSize="10"
                  fontFamily="monospace"
                  fill="var(--color-text-subtle)"
                >
                  {route.distanceNm} NM · {route.etaHours} hrs
                </text>

                {/* Track Background */}
                <rect
                  x={TRACK_X}
                  y={rowY + 12}
                  width={TRACK_W}
                  height={22}
                  rx="4"
                  fill="var(--color-canvas)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />

                {/* Spread Bar (avg to max) */}
                {spreadW > 0 && (
                  <rect
                    x={spreadX}
                    y={rowY + 12}
                    width={spreadW}
                    height={22}
                    rx="2"
                    fill={routeColor}
                    fillOpacity="0.22"
                    stroke={routeColor}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Average Solid Bar */}
                <rect
                  x={TRACK_X}
                  y={rowY + 12}
                  width={avgW}
                  height={22}
                  rx="4"
                  fill={routeColor}
                />
                <text
                  x={TRACK_X + avgW - 6}
                  y={rowY + 27}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill="#ffffff"
                  textAnchor="end"
                >
                  {route.averageRiskScore}
                </text>

                {/* Max Risk Needle & Peak Bracket */}
                <line
                  x1={maxX}
                  y1={rowY + 8}
                  x2={maxX}
                  y2={rowY + 38}
                  stroke={routeColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <polygon
                  points={`${maxX},${rowY + 8} ${maxX - 4},${rowY + 2} ${maxX + 4},${rowY + 2}`}
                  fill={routeColor}
                />

                {/* Right Statistics & Delta Badges */}
                <text
                  x="636"
                  y={rowY + 20}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill={route.maxRiskScore >= 65 ? "var(--color-risk-high)" : "var(--color-navy-900)"}
                >
                  Max {route.maxRiskScore}
                </text>
                <text
                  x="636"
                  y={rowY + 33}
                  fontSize="10"
                  fontFamily="monospace"
                  fill="var(--color-text-subtle)"
                >
                  Δ +{route.maxRiskScore - route.averageRiskScore} pts
                </text>

                {/* Compatibility Chip */}
                <rect
                  x="695"
                  y={rowY + 14}
                  width="55"
                  height="18"
                  rx="4"
                  fill={route.compatibility === "high" ? "var(--color-risk-low-bg)" : "var(--color-risk-med-bg)"}
                  stroke={route.compatibility === "high" ? "var(--color-risk-low)" : "var(--color-risk-med)"}
                  strokeWidth="0.75"
                  strokeOpacity="0.4"
                />
                <text
                  x="722.5"
                  y={rowY + 26}
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill={route.compatibility === "high" ? "var(--color-risk-low)" : "var(--color-risk-med)"}
                >
                  {route.compatibility.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
