"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  RotateCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Fuel,
  Clock,
  Navigation,
  Table,
  Sliders,
  Check,
} from "lucide-react";
import {
  type RouteAlternative,
  type RouteId,
  type OptimizationPreference,
} from "@/lib/data";
import {
  cn,
  formatNauticalMiles,
  formatHours,
  formatFuelTons,
  riskBadge,
  riskBar,
  riskLabel,
} from "@/lib/utils";

interface RouteRevealCardsProps {
  routes: RouteAlternative[];
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  onResimulate: () => void;
  preference: OptimizationPreference;
}

// Polaris RIO scores aligned with route physics
const ROUTE_RIO_SCORES: Record<RouteId, { rio: string; status: "PASS" | "MARGINAL"; note: string }> = {
  balanced: { rio: "+16.8", status: "PASS", note: "Authorized Polar Transit" },
  safest: { rio: "+24.2", status: "PASS", note: "Maximum Ice Standoff" },
  fuel_efficient: { rio: "+11.5", status: "PASS", note: "Optimized Bunker Profile" },
  shortest: { rio: "-3.2", status: "MARGINAL", note: "Elevated Pressure Ice" },
};

export function RouteRevealCards({
  routes,
  selectedRouteId,
  onSelectRoute,
  onResimulate,
  preference,
}: RouteRevealCardsProps) {
  const [showMatrix, setShowMatrix] = useState(false);

  // Recommended route mapping
  const getRecommendedRouteId = (): RouteId => {
    switch (preference) {
      case "safety":
        return "safest";
      case "fuel":
        return "fuel_efficient";
      case "time":
        return "shortest";
      case "balanced":
      default:
        return "balanced";
    }
  };

  const recommendedId = getRecommendedRouteId();

  return (
    <div className="mt-6 rounded-xl border border-risk-low/30 bg-surface p-5 shadow-sm">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-risk-low-bg text-risk-low border border-risk-low/30">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              Mission Simulation Complete
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-700">
                4 Alternatives Synthesized
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Multi-objective A* trajectory optimization converged. Review alternative trade-offs or inspect in Route Optimizer.
            </p>
          </div>
        </div>

        {/* Action button row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMatrix(!showMatrix)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface2 hover:border-border-strong transition-colors cursor-pointer"
          >
            <Table size={13} />
            {showMatrix ? "Hide Matrix" : "Compare Table"}
          </button>

          <button
            type="button"
            onClick={onResimulate}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface2 hover:border-border-strong transition-colors cursor-pointer"
          >
            <RotateCw size={13} />
            Simulate Again
          </button>

          <Link
            href="/routes"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm transition-all cursor-pointer"
          >
            Inspect in Route Optimizer
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* 4 Staggered Route Cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {routes.map((r, idx) => {
          const isRecommended = r.id === recommendedId;
          const isSelected = r.id === selectedRouteId;
          const rio = ROUTE_RIO_SCORES[r.id];

          return (
            <div
              key={r.id}
              style={{
                animationDelay: `${idx * 120}ms`,
                animationFillMode: "both",
              }}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 animate-fade-in",
                isRecommended
                  ? "border-blue-600/70 bg-blue-50/40 ring-2 ring-blue-500/30 shadow-md"
                  : isSelected
                  ? "border-navy-800 bg-surface2 ring-1 ring-navy-800/30 shadow-sm"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface2"
              )}
            >
              {/* Recommended Top Badge */}
              {isRecommended && (
                <div className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs">
                  <Sparkles size={10} />
                  RECOMMENDED BY ENGINE
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mt-1 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 leading-tight">
                      {r.name}
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">
                      {r.tradeOff}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold shrink-0",
                      riskBadge(r.averageRiskScore)
                    )}
                  >
                    Risk: {r.averageRiskScore}
                  </span>
                </div>

                {/* Risk Bar Meter */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-subtle mb-1">
                    <span>Hull Risk Index</span>
                    <span className="font-bold text-navy-800">{riskLabel(r.averageRiskScore)} ({r.averageRiskScore}/100)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", riskBar(r.averageRiskScore))}
                      style={{ width: `${r.averageRiskScore}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface border border-border/80 p-2.5 font-mono text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-text-muted block">Distance</span>
                    <span className="font-bold text-navy-900 flex items-center gap-1">
                      <Navigation size={11} className="text-text-subtle" />
                      {formatNauticalMiles(r.distanceNm)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">ETA Window</span>
                    <span className="font-bold text-navy-900 flex items-center gap-1">
                      <Clock size={11} className="text-text-subtle" />
                      {formatHours(r.etaHours)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Fuel Burn</span>
                    <span className="font-bold text-navy-900 flex items-center gap-1">
                      <Fuel size={11} className="text-text-subtle" />
                      {formatFuelTons(r.fuelTons)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">POLARIS RIO</span>
                    <span
                      className={cn(
                        "font-bold flex items-center gap-1",
                        rio.status === "PASS" ? "text-risk-low" : "text-risk-med"
                      )}
                    >
                      <ShieldCheck size={11} />
                      {rio.rio} {rio.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons on Card */}
              <div className="pt-2 border-t border-border/70 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectRoute(r.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-navy-900 text-white shadow-xs"
                      : "border border-border bg-surface hover:bg-surface2 text-text-secondary"
                  )}
                >
                  {isSelected ? (
                    <>
                      <Check size={12} strokeWidth={3} />
                      Selected Route
                    </>
                  ) : (
                    "Select Route"
                  )}
                </button>

                <Link
                  href="/routes"
                  onClick={() => onSelectRoute(r.id)}
                  className="flex items-center justify-center rounded-lg border border-border bg-surface p-1.5 text-text-muted hover:border-border-strong hover:text-navy-900 transition-colors"
                  title="Inspect in Route Optimizer"
                >
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix Drawer */}
      {showMatrix && (
        <div className="mt-4 rounded-xl border border-border bg-surface2 p-4 overflow-x-auto animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sliders size={14} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Side-by-Side Trajectory Trade-Off Matrix
            </h3>
          </div>
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="py-2 px-3">Route Alternative</th>
                <th className="py-2 px-3">Avg Risk</th>
                <th className="py-2 px-3">Distance (NM)</th>
                <th className="py-2 px-3">ETA (hrs)</th>
                <th className="py-2 px-3">Fuel (MT)</th>
                <th className="py-2 px-3">POLARIS RIO</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {routes.map((r) => (
                <tr
                  key={`tbl-${r.id}`}
                  className={cn(
                    "hover:bg-surface transition-colors",
                    r.id === selectedRouteId && "bg-blue-50/50"
                  )}
                >
                  <td className="py-2.5 px-3 font-sans font-bold text-navy-900">
                    {r.name}
                    {r.id === recommendedId && (
                      <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-700">
                        Recommended
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", riskBadge(r.averageRiskScore))}>
                      {r.averageRiskScore} ({riskLabel(r.averageRiskScore)})
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{r.distanceNm} NM</td>
                  <td className="py-2.5 px-3">{r.etaHours} hrs</td>
                  <td className="py-2.5 px-3">{r.fuelTons} MT</td>
                  <td className="py-2.5 px-3 font-bold text-risk-low">
                    {ROUTE_RIO_SCORES[r.id].rio} ({ROUTE_RIO_SCORES[r.id].status})
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      type="button"
                      onClick={() => onSelectRoute(r.id)}
                      className={cn(
                        "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                        r.id === selectedRouteId
                          ? "bg-navy-900 text-white"
                          : "border border-border bg-surface text-text-secondary hover:bg-surface2"
                      )}
                    >
                      {r.id === selectedRouteId ? "Active" : "Select"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
