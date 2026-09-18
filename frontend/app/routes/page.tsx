"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SimpleMap } from "@/components/map/SimpleMap";
import { RouteCard } from "@/components/routes/RouteCard";
import { useMission } from "@/components/session/MissionContext";
import {
  formatFuelTons,
  formatHours,
  formatNauticalMiles,
  riskBadge,
  riskBar,
  riskLabel,
  cn,
} from "@/lib/utils";
import {
  Info,
  ShieldCheck,
  AlertTriangle,
  Anchor,
  Layers,
  Compass,
  CheckCircle2,
  Navigation,
  FileCheck2,
  BrainCircuit,
  Clock,
  Fuel,
  Ship,
} from "lucide-react";

export default function RoutesPage() {
  const { routes, selectedRoute, selectedRouteId, setSelectedRouteId } = useMission();
  const safest = routes.find((r) => r.id === "safest") ?? routes[1] ?? routes[0];
  const shortest = routes.find((r) => r.id === "shortest") ?? routes[0];
  const fuelEff = routes.find((r) => r.id === "fuel_efficient") ?? routes[2] ?? routes[0];

  const distanceSavedVsSafest = Math.max(0, safest.distanceNm - selectedRoute.distanceNm);
  const fuelSavedVsSafest = Math.max(0, safest.fuelTons - selectedRoute.fuelTons);
  const timeSavedVsSafest = Math.max(0, safest.etaHours - selectedRoute.etaHours);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Route Optimizer</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            4 simultaneous alternatives · Click a card or map line to select and inspect telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/70 px-3 py-1 font-mono text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Active: {selectedRoute.name}
          </span>
        </div>
      </div>

      {/* 4 Route Cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {routes.map((r) => (
          <RouteCard
            key={r.id}
            route={r}
            isSelected={r.id === selectedRouteId}
            onSelect={() => setSelectedRouteId(r.id)}
          />
        ))}
      </div>

      {/* Dynamic Decision Explanation */}
      <div className="mt-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <BrainCircuit size={15} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-navy-900">
                Decision Explanation &amp; AI Pathfinding Rationale — {selectedRoute.name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-bold",
                  selectedRoute.rio.status === "PASS"
                    ? "border-risk-low/30 bg-risk-low-bg text-risk-low"
                    : "border-risk-med/30 bg-risk-med-bg text-risk-med"
                )}
              >
                <ShieldCheck size={12} />
                RIO {selectedRoute.rio.scoreFormatted} ({selectedRoute.rio.status})
              </span>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              <strong className="text-navy-900 font-semibold">{selectedRoute.tradeOff}.</strong>{" "}
              {distanceSavedVsSafest > 0 && (
                <span>
                  Saves <strong className="text-navy-900">{formatNauticalMiles(distanceSavedVsSafest)}</strong> and{" "}
                  <strong className="text-navy-900">{formatHours(timeSavedVsSafest)}</strong> transit time vs the Safest corridor.{" "}
                </span>
              )}
              {fuelSavedVsSafest > 0 && (
                <span>
                  Reduces bunker consumption by <strong className="text-navy-900">{formatFuelTons(fuelSavedVsSafest)}</strong> vs Safest route.{" "}
                </span>
              )}
              Average risk score is{" "}
              <strong className="text-navy-900">{selectedRoute.averageRiskScore}/100</strong> (vs {shortest.averageRiskScore} on Shortest,{" "}
              {safest.averageRiskScore} on Safest, and {fuelEff.averageRiskScore} on Fuel-Efficient).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs text-text-secondary border-t border-blue-200/60">
              <div className="rounded-lg bg-surface/80 p-2.5 border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Algorithmic Heuristic</span>
                <span className="font-semibold text-navy-900">{selectedRoute.aiRationale.algorithm}</span>
                <p className="mt-1 text-[11px] text-text-muted line-clamp-2">{selectedRoute.aiRationale.heuristics}</p>
              </div>
              <div className="rounded-lg bg-surface/80 p-2.5 border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Regulatory Compliance</span>
                <span className="font-semibold text-navy-900">{selectedRoute.rio.regulatoryClause}</span>
                <p className="mt-1 text-[11px] text-text-muted line-clamp-2">{selectedRoute.rio.description}</p>
              </div>
              <div className="rounded-lg bg-surface/80 p-2.5 border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Ice Exposure Regime</span>
                <span className="font-semibold text-navy-900">
                  Peak {selectedRoute.iceExposure.peakIceConcTenths}/10 · {selectedRoute.iceExposure.peakLocation}
                </span>
                <p className="mt-1 text-[11px] text-text-muted">
                  {selectedRoute.iceExposure.heavyRidgePct > 0
                    ? `${selectedRoute.iceExposure.heavyRidgePct}% heavy ridge pack · ${selectedRoute.iceExposure.multiYearIceNm} NM multi-year ice`
                    : `0% heavy ridge pack · ${selectedRoute.iceExposure.multiYearIceNm} NM multi-year ice`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Pathway Telemetry & Waypoints Breakdown */}
      <div className="mt-6 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface2/50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Anchor size={16} className="text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-navy-900">
                Selected Pathway Telemetry &amp; Waypoints Breakdown — {selectedRoute.name}
              </h2>
              <p className="text-xs text-text-muted">
                Detailed waypoint schedule, POLARIS RIO certification, and ice exposure regimes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface px-2.5 py-1 font-mono text-xs font-semibold border border-border text-navy-900">
              {selectedRoute.waypoints.length} Waypoints
            </span>
            <span className="rounded bg-surface px-2.5 py-1 font-mono text-xs font-semibold border border-border text-navy-900">
              {formatNauticalMiles(selectedRoute.distanceNm)} Total
            </span>
          </div>
        </div>

        {/* Top Cards: POLARIS RIO & Ice Exposure Regime Breakdown */}
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {/* POLARIS RIO Certification Card */}
          <div className="rounded-xl border border-border bg-canvas/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 size={15} className="text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  POLARIS RIO Certification
                </h3>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider border",
                  selectedRoute.rio.status === "PASS"
                    ? "bg-risk-low-bg text-risk-low border-risk-low/30"
                    : "bg-risk-med-bg text-risk-med border-risk-med/30"
                )}
              >
                {selectedRoute.rio.status}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={cn(
                  "font-mono text-2xl font-bold",
                  selectedRoute.rio.status === "PASS" ? "text-risk-low" : "text-risk-med"
                )}
              >
                {selectedRoute.rio.scoreFormatted}
              </span>
              <span className="text-xs text-text-muted">Risk Index Outcome (RIO)</span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              {selectedRoute.rio.description}
            </p>

            <div className="rounded-lg bg-surface p-2.5 border border-border text-[11px] font-mono text-text-subtle">
              <span className="font-semibold text-navy-900 block font-sans text-xs">Standard:</span>
              {selectedRoute.rio.regulatoryClause}
            </div>

            {selectedRoute.rio.status === "MARGINAL" && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-900">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Advisory Warning:</strong> Negative RIO requires certified Ice Pilot on the bridge, continuous ice watch, and daylight transit of chokepoints.
                </span>
              </div>
            )}
          </div>

          {/* Ice Exposure Regime Breakdown Card */}
          <div className="rounded-xl border border-border bg-canvas/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Ice Exposure Regime Breakdown
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold text-text-muted">
                Peak: {selectedRoute.iceExposure.peakIceConcTenths}/10
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="mb-2">
              <div className="h-3 w-full rounded-full bg-border overflow-hidden flex shadow-inner">
                {selectedRoute.iceExposure.openWaterPct > 0 && (
                  <div
                    style={{ width: `${selectedRoute.iceExposure.openWaterPct}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`Open Water: ${selectedRoute.iceExposure.openWaterPct}%`}
                  />
                )}
                {selectedRoute.iceExposure.lightIcePct > 0 && (
                  <div
                    style={{ width: `${selectedRoute.iceExposure.lightIcePct}%` }}
                    className="bg-blue-400 transition-all"
                    title={`Light Drift Ice: ${selectedRoute.iceExposure.lightIcePct}%`}
                  />
                )}
                {selectedRoute.iceExposure.mediumPackPct > 0 && (
                  <div
                    style={{ width: `${selectedRoute.iceExposure.mediumPackPct}%` }}
                    className="bg-amber-400 transition-all"
                    title={`Medium Pack: ${selectedRoute.iceExposure.mediumPackPct}%`}
                  />
                )}
                {selectedRoute.iceExposure.heavyRidgePct > 0 && (
                  <div
                    style={{ width: `${selectedRoute.iceExposure.heavyRidgePct}%` }}
                    className="bg-rose-600 transition-all"
                    title={`Heavy Ridges: ${selectedRoute.iceExposure.heavyRidgePct}%`}
                  />
                )}
              </div>
            </div>

            {/* Legend / Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-3">
              <div className="rounded border border-border bg-surface p-2">
                <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Open Water
                </div>
                <span className="text-sm font-bold text-navy-900">{selectedRoute.iceExposure.openWaterPct}%</span>
              </div>
              <div className="rounded border border-border bg-surface p-2">
                <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Light Ice
                </div>
                <span className="text-sm font-bold text-navy-900">{selectedRoute.iceExposure.lightIcePct}%</span>
              </div>
              <div className="rounded border border-border bg-surface p-2">
                <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Medium Pack
                </div>
                <span className="text-sm font-bold text-navy-900">{selectedRoute.iceExposure.mediumPackPct}%</span>
              </div>
              <div className="rounded border border-border bg-surface p-2">
                <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  Heavy Ridges
                </div>
                <span className="text-sm font-bold text-navy-900">{selectedRoute.iceExposure.heavyRidgePct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface p-2.5 border border-border text-xs">
              <div>
                <span className="text-text-muted block text-[10px] uppercase font-bold">Multi-Year Ice Track</span>
                <span className="font-mono font-bold text-navy-900">{selectedRoute.iceExposure.multiYearIceNm} NM</span>
              </div>
              <div className="text-right">
                <span className="text-text-muted block text-[10px] uppercase font-bold">Chokepoint Peak</span>
                <span className="font-semibold text-navy-900">{selectedRoute.iceExposure.peakLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Waypoints Schedule Table */}
        <div className="border-t border-border px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 flex items-center gap-2">
            <Compass size={14} className="text-blue-600" />
            Active Corridor Waypoint Schedule ({selectedRoute.waypoints.length} Waypoints)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-surface2 text-text-muted">
                  <th className="py-2.5 px-3 font-semibold">WP ID</th>
                  <th className="py-2.5 px-3 font-semibold font-sans">Name</th>
                  <th className="py-2.5 px-3 font-semibold">Coordinates</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Leg NM</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cumul NM</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Ice Conc</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Speed Cap</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Risk</th>
                  <th className="py-2.5 px-3 font-semibold font-sans">Operational Hazard Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {selectedRoute.waypoints.map((wp, i) => (
                  <tr key={wp.id} className={cn("hover:bg-surface2/50 transition-colors", i % 2 === 1 && "bg-canvas/40")}>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{wp.id.toUpperCase()}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-navy-900">{wp.name}</td>
                    <td className="py-2.5 px-3 text-text-subtle">{wp.lat}, {wp.lon}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-navy-900">{wp.distNm}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-navy-900">{wp.cumulativeNm}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "inline-block rounded px-1.5 py-0.5 font-bold text-[10px]",
                          wp.iceConcTenths >= 7
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : wp.iceConcTenths >= 4
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        {wp.iceConcTenths}/10
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">{wp.speedLimitKn} kn</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={cn("inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold", riskBadge(wp.riskScore))}>
                        {wp.riskScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs text-text-muted">{wp.hazardNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-6 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-900">Route Comparison Matrix</h2>
          <span className="text-xs text-text-muted">4 corridors evaluated</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface2 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-text-muted">Metric</th>
                {routes.map((r) => (
                  <th
                    key={r.id}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold cursor-pointer transition-colors",
                      r.id === selectedRouteId ? "text-blue-600 bg-blue-50/40" : "text-text-muted hover:text-navy-900"
                    )}
                    onClick={() => setSelectedRouteId(r.id)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{r.name}</span>
                      {r.id === selectedRouteId && (
                        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          SELECTED
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Distance */}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Distance</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "font-bold text-navy-900 bg-blue-50/20")}>
                    {formatNauticalMiles(r.distanceNm)}
                  </td>
                ))}
              </tr>

              {/* ETA */}
              <tr className="border-b border-border bg-surface2/30">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">ETA Duration</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "font-bold text-navy-900 bg-blue-50/20")}>
                    {formatHours(r.etaHours)}
                  </td>
                ))}
              </tr>

              {/* Fuel Burn */}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Fuel Burn</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "font-bold text-navy-900 bg-blue-50/20")}>
                    {formatFuelTons(r.fuelTons)}
                  </td>
                ))}
              </tr>

              {/* Average Risk */}
              <tr className="border-b border-border bg-surface2/30">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Avg Risk</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "bg-blue-50/20")}>
                    <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-bold", riskBadge(r.averageRiskScore))}>
                      {r.averageRiskScore} ({riskLabel(r.averageRiskScore)})
                    </span>
                  </td>
                ))}
              </tr>

              {/* Max Risk */}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Max Risk</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "bg-blue-50/20")}>
                    <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-bold", riskBadge(r.maxRiskScore))}>
                      {r.maxRiskScore}
                    </span>
                  </td>
                ))}
              </tr>

              {/* POLARIS RIO Score */}
              <tr className="border-b border-border bg-surface2/30">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">POLARIS RIO</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "bg-blue-50/20")}>
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[11px] font-bold inline-flex items-center gap-1",
                        r.rio.status === "PASS"
                          ? "border-risk-low/30 bg-risk-low-bg text-risk-low"
                          : "border-risk-med/30 bg-risk-med-bg text-risk-med"
                      )}
                    >
                      <ShieldCheck size={11} />
                      {r.rio.scoreFormatted} {r.rio.status}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Peak Ice Exposure */}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Peak Ice Exposure</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "font-bold text-navy-900 bg-blue-50/20")}>
                    <span className="font-bold">{r.iceExposure.peakIceConcTenths}/10</span>
                    <span className="text-[11px] text-text-muted block font-sans">{r.iceExposure.peakLocation}</span>
                  </td>
                ))}
              </tr>

              {/* Multi-Year Ice / Heavy Ridges */}
              <tr className="border-b border-border bg-surface2/30">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Multi-Year Ice / Ridges</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "font-bold text-navy-900 bg-blue-50/20")}>
                    <span>{r.iceExposure.multiYearIceNm} NM MYI</span>
                    {r.iceExposure.heavyRidgePct > 0 && (
                      <span className="text-[11px] text-rose-700 block font-bold">
                        {r.iceExposure.heavyRidgePct}% Ridge Pack
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Waypoints Count */}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Waypoints Count</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", r.id === selectedRouteId && "font-bold text-navy-900 bg-blue-50/20")}>
                    {r.waypoints.length} WPs
                  </td>
                ))}
              </tr>

              {/* Compatibility */}
              <tr className="border-b border-border bg-surface2/30">
                <td className="px-4 py-2.5 text-xs font-medium text-text-muted">Compatibility</td>
                {routes.map((r) => (
                  <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs capitalize", r.id === selectedRouteId && "font-bold text-navy-900 bg-blue-50/20")}>
                    {r.compatibility}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Map */}
      <div className="mt-6">
        <SimpleMap selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
      </div>
    </AppShell>
  );
}
