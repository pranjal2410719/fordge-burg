"use client";

import { useState } from "react";
import type { RouteId, RouteAlternative } from "@/lib/data";
import { WaypointRiskChart } from "./WaypointRiskChart";
import { RiskRadarChart } from "./RiskRadarChart";
import { RouteRiskComparison } from "./RouteRiskComparison";
import { LayoutGrid, TrendingUp, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskGraphTab = "waypoint" | "radar" | "overview";

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
  const [activeTab, setActiveTab] = useState<RiskGraphTab>("waypoint");

  const tabs: { id: RiskGraphTab; label: string; icon: React.ElementType }[] = [
    { id: "waypoint", label: "Waypoint Profile", icon: TrendingUp },
    { id: "radar", label: "Risk Radar", icon: Radar },
    { id: "overview", label: "Overview Dual", icon: LayoutGrid },
  ];

  return (
    <div className="space-y-3">
      {/* 2-Part Side-by-Side Equal Grid: Left (Route Alternatives 2x2 Grid) | Right (Switchable Graph) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Side: Route Alternatives Risk Comparison (Equal Height) */}
        <div className="flex flex-col h-full">
          <RouteRiskComparison
            selectedRouteId={routeId}
            onSelectRoute={onSelectRoute}
            routes={routes}
          />
        </div>

        {/* Right Side: Switchable Graph Panel (Equal Height) */}
        <div className="flex flex-col h-full rounded-xl border border-border bg-surface p-4 shadow-sm justify-between">
          {/* Top Tab Switcher */}
          <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-3 mb-2 no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                {activeTab === "waypoint"
                  ? "Waypoint Risk Exposure Profile"
                  : activeTab === "radar"
                  ? "Multi-Factor Risk Radar (360°)"
                  : "Combined Risk Overview"}
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface2/60 p-0.5 shadow-2xs">
              {tabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-all cursor-pointer",
                      active
                        ? "bg-navy-900 text-white shadow-xs"
                        : "text-text-muted hover:bg-surface hover:text-navy-900"
                    )}
                  >
                    <Icon size={12} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Graph Body */}
          <div className="flex-1 flex flex-col justify-center">
            {activeTab === "waypoint" && (
              <div className="w-full">
                <WaypointRiskChart routeId={routeId} />
              </div>
            )}

            {activeTab === "radar" && (
              <div className="w-full flex items-center justify-center">
                <RiskRadarChart routeId={routeId} vesselIceClass={vesselIceClass} />
              </div>
            )}

            {activeTab === "overview" && (
              <div className="w-full space-y-3">
                <WaypointRiskChart routeId={routeId} />
                <RiskRadarChart routeId={routeId} vesselIceClass={vesselIceClass} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
