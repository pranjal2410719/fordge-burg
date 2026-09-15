"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useMission } from "@/components/session/MissionContext";
import { cn } from "@/lib/utils";
import { Check, RotateCcw } from "lucide-react";

type UnitSystem = "nautical" | "metric";
type CoordFormat = "dms" | "decimal";
type RiskTolerance = "conservative" | "standard" | "aggressive";

const RISK_LEVELS: { value: RiskTolerance; label: string; threshold: string; desc: string }[] = [
  { value: "conservative", label: "Conservative", threshold: "30/100", desc: "Abort or re-route above risk 30. Maximum safety margin." },
  { value: "standard",     label: "Standard",     threshold: "50/100", desc: "Standard operational risk threshold. Balance risk and efficiency." },
  { value: "aggressive",   label: "Aggressive",   threshold: "70/100", desc: "Extended risk tolerance. For ice-capable vessels only." },
];

export default function SettingsPage() {
  const { } = useMission();

  const [unitSystem,   setUnitSystem]   = useState<UnitSystem>("nautical");
  const [coordFormat,  setCoordFormat]  = useState<CoordFormat>("dms");
  const [riskTolerance,setRiskTolerance]= useState<RiskTolerance>("standard");
  const [mapAutoCenter,setMapAutoCenter]= useState(true);
  const [soundingsDepth,setSoundingsDepth]= useState(50);
  const [mapLayers,    setMapLayers]    = useState({
    ice: true, icebergs: true, hazards: true, routes: true,
  });

  function reset() {
    setUnitSystem("nautical");
    setCoordFormat("dms");
    setRiskTolerance("standard");
    setMapAutoCenter(true);
    setSoundingsDepth(50);
    setMapLayers({ ice: true, icebergs: true, hazards: true, routes: true });
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Settings</h1>
          <p className="mt-0.5 text-sm text-text-muted">In-memory preferences — reset on page reload</p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-border/40 transition-colors"
        >
          <RotateCcw size={13} />
          Reset Defaults
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Unit system */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-navy-900">Unit System</h2>
          <p className="mb-4 text-xs text-text-muted">Controls displayed units across the application</p>
          <div className="grid grid-cols-2 gap-2">
            {(["nautical","metric"] as UnitSystem[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnitSystem(u)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all",
                  unitSystem === u
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                    : "border-border hover:border-border-strong hover:bg-surface2"
                )}
              >
                <div>
                  <p className="text-sm font-semibold capitalize text-navy-900">{u}</p>
                  <p className="text-[11px] text-text-muted">
                    {u === "nautical" ? "NM · kn · MT" : "km · km/h · t"}
                  </p>
                </div>
                {unitSystem === u && <Check size={14} className="shrink-0 text-blue-600" />}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-risk-med-bg border border-risk-med/20 px-3 py-2">
            <p className="text-[11px] text-risk-med">
              Note: Formatting utilities currently always emit nautical units. Metric selection is stored but not applied to displays.
            </p>
          </div>
        </div>

        {/* Coordinate format */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-navy-900">Coordinate Format</h2>
          <p className="mb-4 text-xs text-text-muted">How geographic positions are displayed</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: "dms",     label: "DMS",            example: "63°12.4′S, 56°24.8′W" },
              { value: "decimal", label: "Decimal Degrees", example: "−63.207°, −56.413°" },
            ] as const).map(({ value, label, example }) => (
              <button
                key={value}
                onClick={() => setCoordFormat(value as CoordFormat)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-all",
                  coordFormat === value
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                    : "border-border hover:border-border-strong hover:bg-surface2"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy-900">{label}</span>
                  {coordFormat === value && <Check size={14} className="text-blue-600" />}
                </div>
                <span className="font-mono text-[10px] text-text-muted">{example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Risk tolerance */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-navy-900">Risk Tolerance</h2>
          <p className="mb-4 text-xs text-text-muted">Threshold above which the system issues cautions</p>
          <div className="flex flex-col gap-2">
            {RISK_LEVELS.map(({ value, label, threshold, desc }) => (
              <button
                key={value}
                onClick={() => setRiskTolerance(value)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                  riskTolerance === value
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20"
                    : "border-border hover:border-border-strong hover:bg-surface2"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy-900">{label}</span>
                    <span className="rounded border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-text-muted">
                      {threshold}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-text-muted">{desc}</p>
                </div>
                {riskTolerance === value && <Check size={14} className="mt-0.5 shrink-0 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Map preferences */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-navy-900">Map Preferences</h2>
          <p className="mb-4 text-xs text-text-muted">Layer visibility and behavior</p>

          {/* Layer toggles */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-text-muted">Map Layers</p>
            <div className="grid grid-cols-2 gap-2">
              {(["ice","icebergs","hazards","routes"] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setMapLayers((l) => ({ ...l, [layer]: !l[layer] }))}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all",
                    mapLayers[layer]
                      ? "border-blue-600 bg-blue-50"
                      : "border-border bg-surface2 text-text-muted"
                  )}
                >
                  <span className="capitalize font-semibold">{layer}</span>
                  <span className={cn(
                    "h-5 w-9 rounded-full transition-all relative",
                    mapLayers[layer] ? "bg-blue-600" : "bg-border"
                  )}>
                    <span className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                      mapLayers[layer] ? "translate-x-4" : "translate-x-0"
                    )} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-center */}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-navy-900">Map Auto-center</p>
              <p className="text-[11px] text-text-muted">Automatically pan map to active route</p>
            </div>
            <button
              onClick={() => setMapAutoCenter((v) => !v)}
              className={cn("h-5 w-9 rounded-full transition-all relative", mapAutoCenter ? "bg-blue-600" : "bg-border")}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                mapAutoCenter ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>

          {/* Soundings depth */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-navy-900">Soundings Depth</p>
              <span className="font-mono text-sm font-bold text-navy-900">{soundingsDepth} m</span>
            </div>
            <input
              type="range"
              min={20} max={100} step={5}
              value={soundingsDepth}
              onChange={(e) => setSoundingsDepth(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-text-subtle mt-1">
              <span>20 m</span>
              <span>100 m</span>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Stored, but no soundings layer is currently rendered on the map.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
