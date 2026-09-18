"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SimpleMap } from "@/components/map/SimpleMap";
import { useMission } from "@/components/session/MissionContext";
import { type ForecastHorizon } from "@/lib/data";
import { cn, riskBar } from "@/lib/utils";
import { Thermometer, Wind, Waves, Snowflake, Gauge, ArrowRight } from "lucide-react";

const HORIZONS = [
  { value: 1 as ForecastHorizon, label: "1D", desc: "24 h" },
  { value: 3 as ForecastHorizon, label: "3D", desc: "72 h" },
  { value: 7 as ForecastHorizon, label: "7D", desc: "168 h" },
];

interface MetoceanRow {
  label: string;
  icon: React.ElementType;
  horizon1: string;
  horizon3: string;
  horizon7: string;
  unit: string;
}

const METOCEAN: MetoceanRow[] = [
  { label: "Sea-ice Concentration", icon: Snowflake, horizon1: "4.2",  horizon3: "6.4",  horizon7: "7.9",  unit: "/10" },
  { label: "Ice Thickness",         icon: Gauge,     horizon1: "1.1",  horizon3: "1.6",  horizon7: "2.0",  unit: "m" },
  { label: "Ice Drift Speed",       icon: ArrowRight,horizon1: "0.3",  horizon3: "0.5",  horizon7: "0.8",  unit: "kn" },
  { label: "Sea Surface Temp.",     icon: Thermometer,horizon1: "-1.2",horizon3: "-1.5", horizon7: "-1.8", unit: "°C" },
  { label: "Wind Speed",            icon: Wind,      horizon1: "18",   horizon3: "22",   horizon7: "30",   unit: "kn" },
  { label: "Wave Height (Hs)",      icon: Waves,     horizon1: "1.8",  horizon3: "2.4",  horizon7: "3.1",  unit: "m" },
];

const ICE_ZONES = [
  { name: "Antarctic Sound",    conc: 52, severity: "Moderate", type: "Pressure Ridge" },
  { name: "Weddell Sea",        conc: 82, severity: "High",     type: "Multi-Year Ice" },
  { name: "Larsen Marginal",    conc: 71, severity: "High",     type: "Fast Ice" },
  { name: "Bransfield Strait",  conc: 20, severity: "Low",      type: "Open Lead" },
];

function concBar(v: number) {
  if (v > 65) return "bg-risk-high";
  if (v > 40) return "bg-risk-med";
  return "bg-risk-low";
}

export default function EnvironmentPage() {
  const { forecastHorizon, setHorizon, selectedRouteId, setSelectedRouteId } = useMission();

  const col = forecastHorizon === 1 ? "horizon1" : forecastHorizon === 3 ? "horizon3" : "horizon7";

  return (
    <AppShell>
      <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Environment Intelligence</h1>
          <p className="mt-0.5 text-sm text-text-muted">Sea-ice forecast &amp; metocean telemetry</p>
        </div>
        {/* Horizon selector */}
        <div className="flex rounded-lg border border-border bg-surface p-1 gap-1">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              className={cn(
                "rounded-md px-4 py-1.5 text-xs font-semibold transition-all",
                forecastHorizon === h.value
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-text-muted hover:text-navy-900"
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metocean metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {METOCEAN.map(({ label, icon: Icon, unit, ...horizons }) => {
          const val = horizons[col as keyof typeof horizons];
          return (
            <div key={label} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
                  <Icon size={13} className="text-blue-600" />
                </div>
              </div>
              <p className="font-mono text-lg font-bold text-navy-900">{val}<span className="ml-0.5 text-xs text-text-muted">{unit}</span></p>
              <p className="mt-0.5 text-[10px] text-text-muted leading-tight">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Ice zones + Map */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Ice zone matrix */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-navy-900">Sea-Ice Zone Analysis</h2>
            <p className="text-xs text-text-muted mt-0.5">{forecastHorizon}-day horizon · concentration in tenths</p>
          </div>
          <div className="divide-y divide-border">
            {ICE_ZONES.map((zone) => {
              // scale concentration based on horizon
              const scaleFactor = forecastHorizon === 1 ? 1 : forecastHorizon === 3 ? 1.15 : 1.35;
              const scaledConc = Math.min(100, Math.round(zone.conc * scaleFactor));
              return (
                <div key={zone.name} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{zone.name}</p>
                      <p className="text-xs text-text-muted">{zone.type}</p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold",
                      zone.severity === "High" ? "border-risk-high/30 bg-risk-high-bg text-risk-high" :
                      zone.severity === "Moderate" ? "border-risk-med/30 bg-risk-med-bg text-risk-med" :
                      "border-risk-low/30 bg-risk-low-bg text-risk-low"
                    )}>
                      {zone.severity}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-text-subtle mb-1">
                      <span>Concentration</span>
                      <span>{(scaledConc / 10).toFixed(1)}/10</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", concBar(scaledConc))} style={{ width: `${scaledConc}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horizon progression table */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-navy-900">7-Day Horizon Progression</h2>
            <p className="text-xs text-text-muted mt-0.5">Environmental parameter evolution</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface2 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted">Parameter</th>
                  <th className={cn("px-4 py-3 text-xs font-semibold", forecastHorizon === 1 ? "text-blue-600" : "text-text-muted")}>1D (24h)</th>
                  <th className={cn("px-4 py-3 text-xs font-semibold", forecastHorizon === 3 ? "text-blue-600" : "text-text-muted")}>3D (72h)</th>
                  <th className={cn("px-4 py-3 text-xs font-semibold", forecastHorizon === 7 ? "text-blue-600" : "text-text-muted")}>7D (168h)</th>
                </tr>
              </thead>
              <tbody>
                {METOCEAN.map(({ label, unit, horizon1, horizon3, horizon7 }, i) => (
                  <tr key={label} className={cn("border-b border-border", i % 2 === 1 ? "bg-surface2" : "")}>
                    <td className="px-4 py-2.5 text-xs font-medium text-text-muted">{label}</td>
                    <td className={cn("px-4 py-2.5 font-mono text-xs", forecastHorizon === 1 ? "font-bold text-navy-900" : "text-text-secondary")}>
                      {horizon1} {unit}
                    </td>
                    <td className={cn("px-4 py-2.5 font-mono text-xs", forecastHorizon === 3 ? "font-bold text-navy-900" : "text-text-secondary")}>
                      {horizon3} {unit}
                    </td>
                    <td className={cn("px-4 py-2.5 font-mono text-xs", forecastHorizon === 7 ? "font-bold text-navy-900" : "text-text-secondary")}>
                      {horizon7} {unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mt-4">
        <SimpleMap selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
      </div>
      </div>
    </AppShell>
  );
}
