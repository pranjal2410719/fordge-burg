"use client";

import { useState, useMemo } from "react";
import { BASELINE_ROUTES, type RouteAlternative, type RouteId } from "@/lib/data";
import { ROUTE_COLORS } from "@/components/map/SimpleMap";
import { cn, riskBadge, riskBar, riskLabel } from "@/lib/utils";
import { CorridorDetailModal } from "./CorridorDetailModal";
import {
  Compass,
  Clock,
  Fuel,
  ArrowUpRight,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

interface RouteRiskComparisonProps {
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  routes?: RouteAlternative[];
}

type SortCriterion = "default" | "risk" | "eta" | "fuel";

export function RouteRiskComparison({
  selectedRouteId,
  onSelectRoute,
  routes = BASELINE_ROUTES,
}: RouteRiskComparisonProps) {
  const [sortBy, setSortBy] = useState<SortCriterion>("default");
  const [hoveredRouteId, setHoveredRouteId] = useState<RouteId | null>(null);
  const [detailModalRoute, setDetailModalRoute] = useState<RouteAlternative | null>(null);

  // Sorted routes
  const sortedRoutes = useMemo(() => {
    const list = [...routes];
    if (sortBy === "risk") {
      list.sort((a, b) => a.averageRiskScore - b.averageRiskScore);
    } else if (sortBy === "eta") {
      list.sort((a, b) => a.etaHours - b.etaHours);
    } else if (sortBy === "fuel") {
      list.sort((a, b) => a.fuelTons - b.fuelTons);
    }
    return list;
  }, [routes, sortBy]);

  const activeRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? routes[0],
    [routes, selectedRouteId]
  );

  return (
    <div className="relative w-full h-full rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header & Quick Sort Controls */}
        <div className="flex flex-col gap-2.5 border-b border-border/80 px-4 py-3 bg-surface2/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass size={16} className="text-blue-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Route Alternatives Risk Comparison
              </h3>
            </div>
            <span className="rounded bg-surface2 px-2 py-0.5 text-[10px] font-mono text-text-muted">
              {routes.length} Corridors
            </span>
          </div>

          <p className="text-xs text-text-muted">
            Range-bullet analysis: Average Risk vs Worst-Case Peak Risk · Click card to select, or ↗ for full telemetry popup
          </p>

          {/* Sort & Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2.5 rounded-xs bg-blue-600" />
                <span>Avg</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2.5 rounded-xs border border-dashed border-blue-400 bg-blue-100" />
                <span>Spread</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-0.5 bg-red-600 rounded-full" />
                <span>Peak</span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5 shadow-2xs">
              <span className="px-1.5 text-[9px] font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1">
                <SlidersHorizontal size={9} /> Sort
              </span>
              {[
                { id: "default", label: "Default" },
                { id: "risk", label: "Lowest Risk" },
                { id: "eta", label: "Fastest" },
                { id: "fuel", label: "Eco" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSortBy(id as SortCriterion)}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer",
                    sortBy === id
                      ? "bg-navy-900 text-white shadow-xs"
                      : "text-text-muted hover:bg-surface2 hover:text-navy-900"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2x2 Responsive Corridor Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5">
          {sortedRoutes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const routeColor = ROUTE_COLORS[route.id] || "#2563eb";

            // SVG Scale calculations
            const SVG_W = 320;
            const avgW = (route.averageRiskScore / 100) * SVG_W;
            const maxW = (route.maxRiskScore / 100) * SVG_W;
            const spreadW = Math.max(0, maxW - avgW);

            return (
              <div
                key={route.id}
                onMouseEnter={() => setHoveredRouteId(route.id)}
                onMouseLeave={() => setHoveredRouteId(null)}
                onClick={() => onSelectRoute(route.id)}
                className={cn(
                  "group relative rounded-xl border p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5",
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/80 shadow-xs"
                    : "border-border bg-surface hover:border-blue-300 hover:bg-surface2/50"
                )}
              >
                {/* Card Top: Identity, Badges, & Arrow Popup Button */}
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0 border-2 transition-transform duration-200",
                          isSelected
                            ? "border-blue-600 bg-blue-600 ring-2 ring-blue-200 scale-110"
                            : "border-border-strong bg-surface group-hover:border-blue-400"
                        )}
                      />
                      <span className="text-xs font-bold text-navy-900 group-hover:text-blue-700 transition-colors truncate">
                        {route.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[9px] font-bold uppercase border",
                          riskBadge(route.averageRiskScore)
                        )}
                      >
                        {riskLabel(route.averageRiskScore)}
                      </span>
                      {isSelected && (
                        <span className="rounded bg-blue-600 px-1.5 py-0.2 text-[8px] font-mono font-bold text-white uppercase">
                          Active
                        </span>
                      )}
                      {/* Aero/Popup Window Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModalRoute(route);
                        }}
                        className="rounded-md border border-border bg-surface p-1 text-text-muted hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer"
                        title={`Open full telemetry popup for ${route.name}`}
                      >
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Trade-off subtitle */}
                  <p className="mt-1 text-[11px] text-text-muted line-clamp-1" title={route.tradeOff}>
                    {route.tradeOff}
                  </p>
                </div>

                {/* Card Middle: Native SVG Range-Bullet Visual Vector Track */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-mono font-semibold">
                    <span className="text-text-muted">
                      Avg: <strong className="text-navy-900">{route.averageRiskScore}</strong>/100
                    </span>
                    <span className="text-text-subtle">
                      Peak: <strong className={route.maxRiskScore >= 65 ? "text-risk-high" : "text-navy-900"}>{route.maxRiskScore}</strong> (Δ+{route.maxRiskScore - route.averageRiskScore})
                    </span>
                  </div>

                  <div className="relative w-full rounded overflow-hidden bg-canvas border border-border">
                    <svg viewBox="0 0 320 18" className="w-full h-4.5 select-none block">
                      {/* 3 Risk Zone Background Bands */}
                      <rect x="0" y="0" width="112" height="18" fill="var(--color-risk-low)" fillOpacity="0.1" />
                      <rect x="112" y="0" width="96" height="18" fill="var(--color-risk-med)" fillOpacity="0.1" />
                      <rect x="208" y="0" width="112" height="18" fill="var(--color-risk-high)" fillOpacity="0.1" />

                      {/* Subtle Zone Dividers */}
                      <line x1="112" y1="0" x2="112" y2="18" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 2" />
                      <line x1="208" y1="0" x2="208" y2="18" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 2" />

                      {/* Spread Bar (from Avg to Peak Max) */}
                      {spreadW > 0 && (
                        <rect
                          x={avgW}
                          y="3"
                          width={spreadW}
                          height="12"
                          rx="2"
                          fill={routeColor}
                          fillOpacity="0.25"
                          stroke={routeColor}
                          strokeWidth="1"
                          strokeDasharray="3 2"
                        />
                      )}

                      {/* Solid Average Risk Bar */}
                      <rect
                        x="0"
                        y="3"
                        width={avgW}
                        height="12"
                        rx="2.5"
                        fill={routeColor}
                        className="transition-all duration-300"
                      />

                      {/* Max Risk Needle Pin */}
                      <line
                        x1={maxW}
                        y1="1"
                        x2={maxW}
                        y2="17"
                        stroke={route.maxRiskScore >= 65 ? "var(--color-risk-high)" : routeColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={maxW}
                        cy="2.5"
                        r="2"
                        fill={route.maxRiskScore >= 65 ? "var(--color-risk-high)" : routeColor}
                      />
                    </svg>
                  </div>
                </div>

                {/* Card Bottom: Metadata Badges & Polar RIO */}
                <div className="flex items-center justify-between gap-1 text-[9px] font-mono border-t border-border/50 pt-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <span className="flex items-center gap-0.5">
                      <Clock size={9} />
                      {route.etaHours}h
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Fuel size={9} />
                      {route.fuelTons}MT
                    </span>
                  </div>

                  <span
                    className={cn(
                      "rounded px-1.5 py-0.2 font-bold border text-[8px]",
                      route.rio.status === "PASS"
                        ? "bg-risk-low-bg border-risk-low/30 text-risk-low"
                        : "bg-risk-med-bg border-risk-med/30 text-risk-med"
                    )}
                  >
                    RIO {route.rio.scoreFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Corridor Benchmark Insight Callout */}
      <div className="border-t border-border/80 bg-blue-50/40 p-2.5 px-3 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles size={12} className="text-blue-600 shrink-0" />
          <p className="text-navy-900 font-medium truncate">
            Active: <strong>{activeRoute.name}</strong> ({activeRoute.averageRiskScore}/100)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDetailModalRoute(activeRoute)}
          className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold font-mono shrink-0 inline-flex items-center gap-0.5 cursor-pointer"
        >
          <span>Inspect Full Corridor</span>
          <ArrowUpRight size={11} />
        </button>
      </div>

      {/* Corridor Detailed Telemetry Modal Dialog */}
      {detailModalRoute && (
        <CorridorDetailModal
          isOpen={!!detailModalRoute}
          onClose={() => setDetailModalRoute(null)}
          route={detailModalRoute}
          isSelected={detailModalRoute.id === selectedRouteId}
          onSelectRoute={(id) => onSelectRoute(id)}
        />
      )}
    </div>
  );
}
