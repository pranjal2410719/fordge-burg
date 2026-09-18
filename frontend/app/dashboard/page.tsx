"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SimpleMap } from "@/components/map/SimpleMap";
import { useMission } from "@/components/session/MissionContext";
import {
  formatFuelTons,
  formatHours,
  formatNauticalMiles,
  riskBadge,
  riskLabel,
  riskBar,
  cn,
} from "@/lib/utils";
import { TrendingDown, TrendingUp, Activity, Ship, MapPin, ArrowRight, Settings2, BarChart3, Navigation, AlertTriangle, Loader2, BrainCircuit, ShieldCheck, Anchor } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

function KpiCard({ label, value, sub, trend, trendLabel, accent, icon, isLoading }: KpiProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-surface to-surface2 p-5 shadow-sm transition-all hover:shadow-md",
      accent ?? "border-border/60"
    )}>
      {/* Decorative accent blob */}
      {accent && <div className={cn("absolute -top-4 -right-4 h-16 w-16 rounded-full opacity-10 blur-xl", accent.includes("risk-high") ? "bg-risk-high" : accent.includes("risk-med") ? "bg-risk-med" : "bg-risk-low")} />}
      
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted/80">{label}</p>
        {icon && <div className="text-text-subtle/50 group-hover:text-text-subtle transition-colors">{icon}</div>}
      </div>
      
      {isLoading ? (
        <div className="relative z-10 animate-pulse">
          <div className="h-8 w-24 bg-border/60 rounded mb-2"></div>
          <div className="h-4 w-32 bg-border/40 rounded"></div>
        </div>
      ) : (
        <div className="relative z-10 animate-fade-in">
          <p className="font-mono text-3xl font-bold tracking-tight text-navy-900">{value}</p>
          {sub && <p className="mt-1 text-xs font-medium text-text-subtle">{sub}</p>}
        </div>
      )}
      
      {!isLoading && trend && trendLabel && (
        <div className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide animate-fade-in",
          trend === "down"    ? "bg-risk-low-bg/80 text-risk-low" :
          trend === "up"      ? "bg-risk-high-bg/80 text-risk-high" :
          "bg-canvas text-text-muted"
        )}>
          {trend === "down" ? <TrendingDown size={12} strokeWidth={2.5} /> :
           trend === "up"   ? <TrendingUp size={12} strokeWidth={2.5} /> :
           <Activity size={12} strokeWidth={2.5} />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { selectedRoute, vessel, selectedRouteId, setSelectedRouteId, simulationStatus, mission } = useMission();
  const risk = selectedRoute.averageRiskScore;
  
  // Simulate AI/Backend loading
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => setIsAnalyzing(false), 1800); // Simulate backend AI computation
    return () => clearTimeout(timer);
  }, [selectedRouteId]);

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-600/10">Active Mission</span>
            <span className="text-sm font-medium text-text-subtle">{simulationStatus === 'completed' ? 'Live' : 'Planning'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">{mission.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <Navigation size={14} className="text-blue-500" />
            <span>{mission.origin}</span>
            <ArrowRight size={12} className="text-border-strong" />
            <span>{mission.destination}</span>
          </p>
        </div>
        <Link
          href="/mission"
          className="group flex shrink-0 items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-800 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
        >
          <Settings2 size={16} className="opacity-80 group-hover:opacity-100 transition-opacity" /> Configure Mission
        </Link>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* Left Sidebar (Vessel & Route Details) */}
        <div className="flex flex-col gap-5 lg:col-span-4 xl:col-span-3">
          {/* Active Vessel Panel */}
          <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-surface to-surface2/50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Ship size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy-900">Vessel Details</h2>
                <p className="text-xs text-text-muted">Currently Assigned</p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-bold text-navy-900">{vessel.name}</p>
                <span className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 shadow-sm">
                  {vessel.iceClass}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl bg-canvas/50 p-4 border border-border/40">
                {[
                  ["LOA",       `${vessel.loaM} m`],
                  ["Beam",      `${vessel.beamM} m`],
                  ["Draft",     `${vessel.draftM} m`],
                  ["Open Water",`${vessel.openWaterKn} kn`],
                  ["Ice Limit", `${vessel.iceLimitKn} kn`],
                  ["Burn Rate",  `${vessel.fuelTonsPerDay} MT/d`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-1">{k}</dt>
                    <dd className="font-mono text-sm font-medium text-navy-900">{v}</dd>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Route Summary Panel */}
          <div className="flex-1 rounded-2xl border border-border/60 bg-gradient-to-b from-surface to-surface2/50 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                <Navigation size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy-900">Route Overview</h2>
                <p className="text-xs text-text-muted">Selected Itinerary</p>
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-base font-bold text-navy-900">{selectedRoute.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-text-muted">{selectedRoute.tradeOff}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* POLARIS RIO Badge */}
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border px-2 py-1.5 shadow-xs",
                      selectedRoute.rio.status === "PASS"
                        ? "border-risk-low/30 bg-risk-low-bg text-risk-low"
                        : "border-risk-med/30 bg-risk-med-bg text-risk-med"
                    )}
                    title={selectedRoute.rio.description}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">RIO</span>
                    <span className="font-mono text-xs font-bold leading-none">{selectedRoute.rio.scoreFormatted}</span>
                  </div>
                  {/* Risk Badge */}
                  <div className={cn("flex flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 shadow-xs min-w-[2.8rem]", riskBadge(risk))}>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Risk</span>
                    <span className="font-mono text-base font-bold leading-none">{risk}</span>
                  </div>
                </div>
              </div>
              
              {/* Risk Tolerance Meter */}
              <div className="mb-4 bg-canvas/50 p-3 rounded-xl border border-border/40">
                <div className="flex justify-between text-xs font-medium text-text-subtle mb-1.5">
                  <span>Safety Tolerance</span>
                  <span className="font-bold text-navy-900">{riskLabel(risk)} ({risk}/100)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border/60 overflow-hidden shadow-inner">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", riskBar(risk))}
                    style={{ width: `${risk}%` }}
                  />
                </div>
              </div>

              {/* Ice Exposure Breakdown */}
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-canvas/60 p-3 border border-border/40 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle block">Peak Ice Exposure</span>
                  <span className="font-mono font-bold text-navy-900 text-sm">
                    {selectedRoute.iceExposure.peakIceConcTenths}/10
                  </span>
                  <span className="text-[10px] text-text-muted block truncate" title={selectedRoute.iceExposure.peakLocation}>
                    {selectedRoute.iceExposure.peakLocation}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle block">Pack / Heavy Ridges</span>
                  <span className="font-mono font-bold text-navy-900 text-sm">
                    {selectedRoute.iceExposure.mediumPackPct + selectedRoute.iceExposure.heavyRidgePct}%
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    {selectedRoute.iceExposure.multiYearIceNm > 0
                      ? `${selectedRoute.iceExposure.multiYearIceNm} NM Multi-Year`
                      : "0 NM Multi-Year Ice"}
                  </span>
                </div>
              </div>

              {/* Waypoints Summary */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-surface p-2.5 border border-border/50 text-xs">
                <div className="flex items-center gap-2">
                  <Anchor size={14} className="text-blue-600" />
                  <span className="font-semibold text-navy-900">{selectedRoute.waypoints.length} Waypoints Scheduled</span>
                </div>
                <span className="font-mono text-text-muted text-[11px]">
                  {selectedRoute.waypoints[0]?.name.split(" ")[0]} → {selectedRoute.waypoints[selectedRoute.waypoints.length - 1]?.name.split(" ")[0]}
                </span>
              </div>

              {/* AI Algorithmic Rationale (Dynamically driven by selectedRoute.aiRationale) */}
              <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/30 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <BrainCircuit size={14} className="text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">AI Pathfinding Rationale</h3>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                    {selectedRoute.id.toUpperCase()}
                  </span>
                </div>
                {isAnalyzing ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 w-full bg-blue-100 rounded"></div>
                    <div className="h-3 w-5/6 bg-blue-100 rounded"></div>
                    <div className="h-3 w-4/6 bg-blue-100 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-blue-900/85 animate-fade-in">
                    <p>
                      <strong>Algorithm:</strong>{" "}
                      <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-blue-800">
                        {selectedRoute.aiRationale.algorithm}
                      </span>
                    </p>
                    <p className="leading-relaxed">
                      <strong>Heuristics:</strong> {selectedRoute.aiRationale.heuristics}
                    </p>
                    <p className="leading-relaxed text-blue-950">
                      <strong>Trade-off:</strong> {selectedRoute.aiRationale.tradeOff}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-2">
                <Link
                  href="/routes"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-secondary shadow-sm hover:bg-canvas hover:text-navy-900 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
                >
                  Compare Alternatives <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 transition-opacity group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Area (KPIs & Map) */}
        <div className="flex flex-col gap-6 lg:col-span-8 xl:col-span-9">
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
            <KpiCard
              label="Average Risk"
              value={`${risk}`}
              sub={riskLabel(risk) + " threshold"}
              trend={risk > 50 ? "up" : "down"}
              trendLabel={risk > 50 ? "Elevated" : "Within bounds"}
              accent={risk > 65 ? "border-risk-high/40 ring-1 ring-risk-high/20" :
                      risk > 35 ? "border-risk-med/40" : "border-risk-low/40"}
              icon={<AlertTriangle size={20} />}
              isLoading={isAnalyzing}
            />
            <KpiCard
              label="Transit Dist"
              value={formatNauticalMiles(selectedRoute.distanceNm)}
              sub={selectedRoute.name + " profile"}
              trend="neutral"
              trendLabel="Baseline Route"
              icon={<Navigation size={20} />}
              isLoading={isAnalyzing}
            />
            <KpiCard
              label="Est. Duration"
              value={formatHours(selectedRoute.etaHours)}
              sub={`@ ${vessel.iceLimitKn}kn limit`}
              trend="neutral"
              trendLabel="Optimized"
              icon={<Activity size={20} />}
              isLoading={isAnalyzing}
            />
            <KpiCard
              label="Bunker Fuel"
              value={formatFuelTons(selectedRoute.fuelTons)}
              sub={`${vessel.fuelTonsPerDay} MT/day burn`}
              trend="neutral"
              trendLabel="Reserve Check"
              icon={<BarChart3 size={20} />}
              isLoading={isAnalyzing}
            />
          </div>

          {/* Main Map */}
          <div className="flex-1 flex flex-col rounded-2xl border border-border bg-surface shadow-sm overflow-hidden min-h-[500px]">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3 bg-surface/50">
              <h2 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
                <MapPin size={16} className="text-blue-500" /> Live Environment
              </h2>
              {isAnalyzing && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md animate-pulse">
                  <Loader2 size={12} className="animate-spin" /> AI Engine Processing...
                </span>
              )}
            </div>
            <div className="flex-1 relative bg-canvas min-h-[400px]">
              {isAnalyzing && (
                <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center transition-all">
                  <BrainCircuit size={48} className="text-blue-500 animate-pulse mb-4" />
                  <h3 className="text-lg font-bold text-navy-900">Evaluating Neural Heuristics</h3>
                  <p className="text-sm text-text-muted mt-2 max-w-sm text-center">Crunching ice concentration arrays and running multi-objective A* simulation across {vessel.name}'s performance profile...</p>
                </div>
              )}
              <SimpleMap selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Disclaimer */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900/80 leading-relaxed">
          <strong className="text-blue-900 font-semibold mr-1">Advisory system only.</strong> 
          The Master and certified Ice Pilot retain sole command authority under SOLAS Ch. V and the IMO Polar Code. This system provides decision support — not autonomous navigation.
        </p>
      </div>
    </AppShell>
  );
}
