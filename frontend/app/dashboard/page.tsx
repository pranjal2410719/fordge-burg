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
import { TrendingDown, TrendingUp, Activity, Ship, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  accent?: string;
}

function KpiCard({ label, value, sub, trend, trendLabel, accent }: KpiProps) {
  return (
    <div className={cn("rounded-xl border bg-surface p-4 shadow-sm", accent ?? "border-border")}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold text-navy-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-subtle">{sub}</p>}
      {trend && trendLabel && (
        <div className={cn(
          "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          trend === "down"    ? "bg-risk-low-bg text-risk-low" :
          trend === "up"      ? "bg-risk-high-bg text-risk-high" :
          "bg-surface2 text-text-muted"
        )}>
          {trend === "down" ? <TrendingDown size={10} /> :
           trend === "up"   ? <TrendingUp size={10} /> :
           <Activity size={10} />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { selectedRoute, vessel, selectedRouteId, setSelectedRouteId, simulationStatus, mission } = useMission();
  const risk = selectedRoute.averageRiskScore;

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Mission Control</h1>
          <p className="mt-0.5 text-sm text-text-muted">{mission.name} · {mission.origin} → {mission.destination}</p>
        </div>
        <Link
          href="/mission"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-border/40 transition-colors"
        >
          Configure <ArrowRight size={12} />
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Average Risk Score"
          value={`${risk} / 100`}
          sub={riskLabel(risk) + " risk level"}
          trend={risk > 50 ? "up" : "down"}
          trendLabel={risk > 50 ? "Elevated" : "Within tolerance"}
          accent={risk > 65 ? "border-risk-high/30 ring-1 ring-risk-high/10" :
                  risk > 35 ? "border-risk-med/30" : "border-risk-low/30"}
        />
        <KpiCard
          label="Transit Distance"
          value={formatNauticalMiles(selectedRoute.distanceNm)}
          sub={selectedRoute.name + " route"}
          trend="neutral"
          trendLabel="Baseline"
        />
        <KpiCard
          label="Estimated Duration"
          value={formatHours(selectedRoute.etaHours)}
          sub="at current ice speed limit"
          trend="neutral"
          trendLabel={`Vessel: ${vessel.iceLimitKn} kn ice limit`}
        />
        <KpiCard
          label="Bunker Fuel Estimate"
          value={formatFuelTons(selectedRoute.fuelTons)}
          sub={`${vessel.fuelTonsPerDay} MT/day burn rate`}
          trend="neutral"
          trendLabel="Fuel reserve check req."
        />
      </div>

      {/* Map + Vessel panel */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SimpleMap selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
        </div>
        <div className="flex flex-col gap-3">
          {/* Vessel card */}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900/5">
                <Ship size={14} className="text-navy-900" />
              </div>
              <h2 className="text-sm font-semibold text-navy-900">Active Vessel</h2>
            </div>
            <p className="font-semibold text-navy-900">{vessel.name}</p>
            <span className="mt-1 inline-block rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-600">
              {vessel.iceClass}
            </span>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
              {[
                ["LOA",       `${vessel.loaM} m`],
                ["Beam",      `${vessel.beamM} m`],
                ["Draft",     `${vessel.draftM} m`],
                ["Open water",`${vessel.openWaterKn} kn`],
                ["Ice limit", `${vessel.iceLimitKn} kn`],
                ["Fuel/day",  `${vessel.fuelTonsPerDay} MT`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-text-subtle">{k}</dt>
                  <dd className="font-semibold text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Route summary */}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900/5">
                <MapPin size={14} className="text-navy-900" />
              </div>
              <h2 className="text-sm font-semibold text-navy-900">Selected Route</h2>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-navy-900">{selectedRoute.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">{selectedRoute.tradeOff}</p>
              </div>
              <span className={cn("shrink-0 rounded border px-2 py-0.5 font-mono text-xs font-semibold", riskBadge(risk))}>
                {risk}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-text-subtle mb-1">
                <span>Risk level</span>
                <span>{risk}/100</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", riskBar(risk))}
                  style={{ width: `${risk}%` }}
                />
              </div>
            </div>
            <Link
              href="/routes"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold text-text-secondary hover:bg-border/40 transition-colors"
            >
              Compare routes <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* SOLAS disclaimer */}
      <div className="mt-4 rounded-xl border border-border bg-surface2 px-4 py-3">
        <p className="text-xs text-text-subtle">
          <strong className="text-text-muted">Advisory system only.</strong> The Master and certified Ice Pilot retain sole command authority under SOLAS Ch. V and the IMO Polar Code. This system provides decision support — not autonomous navigation.
        </p>
      </div>
    </AppShell>
  );
}
