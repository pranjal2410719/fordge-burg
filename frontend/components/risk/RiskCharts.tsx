"use client";

import { useState } from "react";
import type { RouteId, RouteAlternative } from "@/lib/data";
import { WaypointRiskChart } from "./WaypointRiskChart";
import { RiskRadarChart } from "./RiskRadarChart";
import { RouteRiskComparison } from "./RouteRiskComparison";
import { LayoutGrid, TrendingUp, Radar, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskChartViewMode = "all" | "waypoint" | "radar" | "comparison";

export interface RiskChartsProps {
  routeId: RouteId;
  vesselIceClass: string;
  onSelectRoute: (id: RouteId) => void;
  routes?: RouteAlternative[];
}

export function RiskCharts({
  routeId,
  vesselIceClass,
  onSelectRoute,
  routes,
}: RiskChartsProps) {
  const [viewMode, setViewMode] = useState<RiskChartViewMode>("all");

  return (
    <div className="space-y-4">
      {/* Chart View Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-2.5 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
            Risk Visualizations
          </span>
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-600">
            Native SVG Vector Engine
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-xs">
          {[
            { id: "all", label: "Overview Grid", icon: LayoutGrid },
            { id: "waypoint", label: "Waypoint Profile", icon: TrendingUp },
            { id: "radar", label: "Risk Radar", icon: Radar },
            { id: "comparison", label: "Route Benchmark", icon: BarChart2 },
          ].map(({ id, label, icon: Icon }) => {
            const active = viewMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id as RiskChartViewMode)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  active
                    ? "bg-navy-900 text-white shadow-xs"
                    : "text-text-muted hover:bg-surface2 hover:text-navy-900"
                )}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualizations Grid */}
      {viewMode === "all" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <WaypointRiskChart routeId={routeId} />
            </div>
            <div className="lg:col-span-5">
              <RiskRadarChart routeId={routeId} vesselIceClass={vesselIceClass} />
            </div>
          </div>
          <div>
            <RouteRiskComparison
              selectedRouteId={routeId}
              onSelectRoute={onSelectRoute}
              routes={routes}
            />
          </div>
        </div>
      ) : viewMode === "waypoint" ? (
        <div>
          <WaypointRiskChart routeId={routeId} />
        </div>
      ) : viewMode === "radar" ? (
        <div className="max-w-2xl mx-auto">
          <RiskRadarChart routeId={routeId} vesselIceClass={vesselIceClass} />
        </div>
      ) : (
        <div>
          <RouteRiskComparison
            selectedRouteId={routeId}
            onSelectRoute={onSelectRoute}
            routes={routes}
          />
        </div>
      )}
    </div>
  );
}
