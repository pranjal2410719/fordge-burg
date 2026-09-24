"use client";

import { RiskModalBase } from "./RiskModalBase";
import { ROUTE_COLORS } from "@/components/map/SimpleMap";
import { riskBadge, riskBar, riskLabel, cn } from "@/lib/utils";
import type { RouteAlternative, RouteId } from "@/lib/data";
import {
  Compass,
  Clock,
  Fuel,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  MapPin,
  CheckCircle2,
  Cpu,
  ChevronRight,
} from "lucide-react";

export interface CorridorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteAlternative | null;
  isSelected: boolean;
  onSelectRoute: (id: RouteId) => void;
}

export function CorridorDetailModal({
  isOpen,
  onClose,
  route,
  isSelected,
  onSelectRoute,
}: CorridorDetailModalProps) {
  if (!route) return null;

  const routeColor = ROUTE_COLORS[route.id] || "#2563eb";
  const isPass = route.rio.status === "PASS";

  return (
    <RiskModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={`${route.name} Corridor — Detailed Telemetry`}
      subtitle={route.tradeOff}
      maxWidthClass="max-w-3xl"
      badge={
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded border px-2 py-0.5 font-mono text-xs font-bold uppercase",
              riskBadge(route.averageRiskScore)
            )}
          >
            Risk {route.averageRiskScore}/100 · {riskLabel(route.averageRiskScore)}
          </span>
          {isSelected && (
            <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-mono font-bold text-white uppercase">
              Active Corridor
            </span>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-xs text-text-muted hidden sm:inline">
            POLARIS Assessment: <strong className={isPass ? "text-risk-low" : "text-risk-med"}>{route.rio.status} ({route.rio.scoreFormatted})</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-muted hover:bg-surface2 hover:text-navy-900 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectRoute(route.id);
                onClose();
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm",
                isSelected
                  ? "bg-risk-low hover:bg-risk-low/90"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isSelected ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Currently Active</span>
                </>
              ) : (
                <>
                  <Compass size={14} />
                  <span>Select This Corridor</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 1. Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="rounded-xl border border-border bg-surface2/50 p-3">
            <p className="text-[10px] font-semibold uppercase text-text-muted flex items-center justify-center gap-1">
              <Clock size={11} /> Duration (ETA)
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-navy-900">
              {route.etaHours} <span className="text-xs font-normal text-text-muted">hrs</span>
            </p>
            <p className="text-[10px] text-text-subtle font-mono">{route.distanceNm} NM distance</p>
          </div>

          <div className="rounded-xl border border-border bg-surface2/50 p-3">
            <p className="text-[10px] font-semibold uppercase text-text-muted flex items-center justify-center gap-1">
              <Fuel size={11} /> Fuel Consumption
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-navy-900">
              {route.fuelTons} <span className="text-xs font-normal text-text-muted">MT</span>
            </p>
            <p className="text-[10px] text-text-subtle font-mono">Polar MGO / DMA</p>
          </div>

          <div className="rounded-xl border border-border bg-surface2/50 p-3">
            <p className="text-[10px] font-semibold uppercase text-text-muted flex items-center justify-center gap-1">
              <ShieldCheck size={11} /> Peak Exposure
            </p>
            <p className={cn("mt-1 font-mono text-lg font-bold", route.maxRiskScore >= 65 ? "text-risk-high" : "text-navy-900")}>
              {route.maxRiskScore} <span className="text-xs font-normal text-text-muted">/100</span>
            </p>
            <p className="text-[10px] text-text-subtle truncate">{route.iceExposure.peakLocation}</p>
          </div>

          <div className="rounded-xl border border-border bg-surface2/50 p-3">
            <p className="text-[10px] font-semibold uppercase text-text-muted flex items-center justify-center gap-1">
              <Sparkles size={11} /> POLARIS RIO
            </p>
            <p className={cn("mt-1 font-mono text-lg font-bold", isPass ? "text-risk-low" : "text-risk-med")}>
              {route.rio.scoreFormatted}
            </p>
            <p className="text-[10px] text-text-subtle font-semibold">{route.rio.status}</p>
          </div>
        </div>

        {/* 2. AI Navigation Rationale */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              AI Navigation Optimization Rationale
            </h4>
            <span className="rounded bg-surface2 px-1.5 py-0.2 text-[9px] font-mono text-text-muted">
              {route.aiRationale.algorithm}
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {route.aiRationale.heuristics}
          </p>
          <div className="mt-2 rounded-lg bg-blue-50/40 border border-blue-200/60 p-2.5 text-xs text-blue-950">
            <strong>Trade-off Evaluation:</strong> {route.aiRationale.tradeOff}
          </div>
        </div>

        {/* 3. Ice Exposure Breakdown */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Ice Regime &amp; Pack Exposure
              </h4>
            </div>
            <span className="text-[10px] font-mono text-text-muted">
              Peak Conc: {route.iceExposure.peakIceConcTenths}/10 · Multi-Year: {route.iceExposure.multiYearIceNm} NM
            </span>
          </div>

          <div className="h-3 w-full rounded-full overflow-hidden flex bg-border">
            <div
              style={{ width: `${route.iceExposure.openWaterPct}%` }}
              className="bg-sky-400 h-full"
              title={`Open Water: ${route.iceExposure.openWaterPct}%`}
            />
            <div
              style={{ width: `${route.iceExposure.lightIcePct}%` }}
              className="bg-emerald-400 h-full"
              title={`Light Ice: ${route.iceExposure.lightIcePct}%`}
            />
            <div
              style={{ width: `${route.iceExposure.mediumPackPct}%` }}
              className="bg-amber-400 h-full"
              title={`Medium Pack: ${route.iceExposure.mediumPackPct}%`}
            />
            <div
              style={{ width: `${route.iceExposure.heavyRidgePct}%` }}
              className="bg-rose-500 h-full"
              title={`Heavy Ridges: ${route.iceExposure.heavyRidgePct}%`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span>Open Water: {route.iceExposure.openWaterPct}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Light Ice: {route.iceExposure.lightIcePct}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Medium Pack: {route.iceExposure.mediumPackPct}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Heavy Ridges: {route.iceExposure.heavyRidgePct}%</span>
            </div>
          </div>
        </div>

        {/* 4. Waypoints Sequence */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-surface2/40 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Corridor Waypoint Progression
              </h4>
            </div>
            <span className="text-[10px] font-mono text-text-muted">
              {route.waypoints.length} Surveyed Legs
            </span>
          </div>

          <div className="divide-y divide-border overflow-x-auto max-h-52">
            {route.waypoints.map((wp, i) => (
              <div key={wp.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-surface2/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface2 text-[10px] font-mono font-bold text-navy-900 shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900 truncate">{wp.name}</p>
                    <p className="text-[10px] text-text-subtle font-mono">
                      {wp.lat}, {wp.lon} · Leg {wp.distNm} NM ({wp.cumulativeNm} NM cum.)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                  <div className="hidden sm:block">
                    <span className="text-[10px] text-text-muted">Ice: {wp.iceConcTenths}/10</span>
                    <p className="text-[10px] text-text-subtle">Ceiling: {wp.speedLimitKn} kn</p>
                  </div>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold border",
                      riskBadge(wp.riskScore)
                    )}
                  >
                    {wp.riskScore}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. POLARIS Regulatory Guidance */}
        <div className="rounded-lg bg-surface2 p-3 text-xs text-text-muted flex items-start gap-2 border border-border">
          <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-navy-900">{route.rio.regulatoryClause}</p>
            <p className="text-[11px] mt-0.5 leading-relaxed">{route.rio.description}</p>
          </div>
        </div>
      </div>
    </RiskModalBase>
  );
}
