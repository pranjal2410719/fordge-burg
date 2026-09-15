"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SimpleMap } from "@/components/map/SimpleMap";
import { RouteCard } from "@/components/routes/RouteCard";
import { useMission } from "@/components/session/MissionContext";
import { formatFuelTons, formatHours, formatNauticalMiles, riskBadge, riskBar, cn } from "@/lib/utils";
import { Info } from "lucide-react";

const METRICS = [
  { key: "distanceNm",       label: "Distance",    fmt: (v: number) => formatNauticalMiles(v) },
  { key: "etaHours",         label: "ETA",         fmt: (v: number) => formatHours(v) },
  { key: "fuelTons",         label: "Fuel",        fmt: (v: number) => formatFuelTons(v) },
  { key: "averageRiskScore", label: "Avg Risk",    fmt: (v: number) => `${v}` },
  { key: "maxRiskScore",     label: "Max Risk",    fmt: (v: number) => `${v}` },
  { key: "compatibility",    label: "Compat.",     fmt: (v: string) => v },
] as const;

export default function RoutesPage() {
  const { routes, selectedRoute, selectedRouteId, setSelectedRouteId } = useMission();
  const safest  = routes.find((r) => r.id === "safest")  ?? routes[0];
  const shortest = routes.find((r) => r.id === "shortest") ?? routes[0];

  const distanceSaved = Math.max(0, safest.distanceNm - selectedRoute.distanceNm);
  const fuelSaved     = Math.max(0, safest.fuelTons  - selectedRoute.fuelTons);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Route Optimizer</h1>
        <p className="mt-0.5 text-sm text-text-muted">4 simultaneous alternatives · Click a card or map line to select</p>
      </div>

      {/* 4 route cards */}
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

      {/* Decision explanation */}
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600">
            <Info size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Decision Explanation — {selectedRoute.name}</h2>
            <p className="mt-1 text-sm text-text-secondary leading-relaxed">
              {selectedRoute.tradeOff}.
              {distanceSaved > 0 && ` Saves ${formatNauticalMiles(distanceSaved)} vs the safest route`}
              {fuelSaved > 0 && ` and ${formatFuelTons(fuelSaved)} fuel`}.
              {" "}Average risk score <strong className="text-navy-900">{selectedRoute.averageRiskScore}/100</strong>{" "}
              (baseline shortest is {shortest.averageRiskScore}; safest is {safest.averageRiskScore}).
              Vessel compatibility: <strong className="text-navy-900">{selectedRoute.compatibility}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-4 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-navy-900">Route Comparison Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface2 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-text-muted">Metric</th>
                {routes.map((r) => (
                  <th key={r.id} className={cn("px-4 py-3 text-xs font-semibold", r.id === selectedRouteId ? "text-blue-600" : "text-text-muted")}>
                    {r.name}
                    {r.id === selectedRouteId && (
                      <span className="ml-1.5 inline-block rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">SELECTED</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map(({ key, label, fmt }, rowIdx) => (
                <tr key={key} className={cn("border-b border-border", rowIdx % 2 === 1 ? "bg-surface2" : "")}>
                  <td className="px-4 py-2.5 text-xs font-medium text-text-muted">{label}</td>
                  {routes.map((r) => {
                    const val = r[key] as number & string;
                    const isSelected = r.id === selectedRouteId;
                    const isRisk = key === "averageRiskScore" || key === "maxRiskScore";
                    return (
                      <td key={r.id} className={cn("px-4 py-2.5 font-mono text-xs", isSelected ? "font-bold text-navy-900" : "text-text-secondary")}>
                        {isRisk ? (
                          <span className={cn("rounded border px-1.5 py-0.5 text-[11px]", riskBadge(val as number))}>
                            {fmt(val)}
                          </span>
                        ) : fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map */}
      <div className="mt-4">
        <SimpleMap selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
      </div>
    </AppShell>
  );
}
