"use client";

import { RotateCw, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useMission } from "@/components/session/MissionContext";
import { MISSIONS, VESSELS, type ForecastHorizon, type OptimizationPreference } from "@/lib/data";
import { cn, formatNauticalMiles, formatHours, formatFuelTons, riskBadge } from "@/lib/utils";
import Link from "next/link";

const HORIZONS: { value: ForecastHorizon; label: string; desc: string }[] = [
  { value: 1, label: "1 Day",   desc: "24 h · Low uncertainty" },
  { value: 3, label: "3 Days",  desc: "72 h · Moderate uncertainty" },
  { value: 7, label: "7 Days",  desc: "168 h · High uncertainty" },
];

const OBJECTIVES: { value: OptimizationPreference; label: string; desc: string }[] = [
  { value: "balanced", label: "Balanced",  desc: "Best risk/fuel/time trade-off" },
  { value: "safety",   label: "Safety",    desc: "Lowest risk, longer transit" },
  { value: "fuel",     label: "Fuel",      desc: "Minimum bunker consumption" },
  { value: "time",     label: "Time",      desc: "Fastest ETA" },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h2>
      {children}
    </div>
  );
}

export default function MissionPage() {
  const {
    mission, vessel, forecastHorizon, preference,
    setMissionId, setVesselId, setHorizon, setPreference,
    simulationStatus, simulationProgress, runSimulation, routes,
  } = useMission();

  return (
    <AppShell>
      {/* Header + stepper */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Mission Planner</h1>
        <p className="mt-0.5 text-sm text-text-muted">Configure your voyage parameters, then run the simulation engine.</p>
        <ol className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-text-muted" aria-label="Planner steps">
          {["1 · Scenario", "2 · Vessel", "3 · Horizon", "4 · Objective", "5 · Run"].map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className={cn(
                "rounded-full border px-2.5 py-1",
                i === 4 && simulationStatus === "completed"
                  ? "border-risk-low/40 bg-risk-low-bg text-risk-low"
                  : "border-border bg-surface text-text-muted"
              )}>{s}</span>
              {i < 4 && <ChevronRight size={12} className="text-text-subtle" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mission scenario */}
        <SectionCard title="Mission Scenario">
          <div className="flex flex-col gap-2">
            {MISSIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMissionId(m.id)}
                className={cn(
                  "group w-full rounded-lg border px-4 py-3 text-left transition-all",
                  mission.id === m.id
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/30"
                    : "border-border hover:border-border-strong hover:bg-surface2"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy-900">{m.name}</span>
                  {mission.id === m.id && (
                    <CheckCircle2 size={14} className="text-blue-600" />
                  )}
                </div>
                <p className="mt-0.5 font-mono text-xs text-text-muted">
                  {m.origin} → {m.destination} · {m.distanceNm} NM
                </p>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Vessel selection */}
        <SectionCard title="Vessel Profile — 5 archetypes">
          <div className="flex flex-col gap-2">
            {VESSELS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVesselId(v.id)}
                className={cn(
                  "group w-full rounded-lg border px-4 py-3 text-left transition-all",
                  vessel.id === v.id
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/30"
                    : "border-border hover:border-border-strong hover:bg-surface2"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy-900">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold",
                      v.iceClass === "PC2" ? "border-blue-300 bg-blue-50 text-blue-700" :
                      v.iceClass === "PC4" ? "border-risk-low/40 bg-risk-low-bg text-risk-low" :
                      v.iceClass === "PC5" ? "border-risk-med/40 bg-risk-med-bg text-risk-med" :
                      "border-risk-high/40 bg-risk-high-bg text-risk-high"
                    )}>
                      {v.iceClass}
                    </span>
                    {vessel.id === v.id && <CheckCircle2 size={14} className="text-blue-600" />}
                  </div>
                </div>
                <p className="mt-0.5 font-mono text-xs text-text-muted">
                  {v.loaM} m · Ice limit {v.iceLimitKn} kn · {v.fuelTonsPerDay} MT/day
                </p>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Forecast horizon */}
        <SectionCard title="Forecast Horizon">
          <div className="grid grid-cols-3 gap-2">
            {HORIZONS.map((h) => (
              <button
                key={h.value}
                onClick={() => setHorizon(h.value)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-center transition-all",
                  forecastHorizon === h.value
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-border hover:border-border-strong hover:bg-surface2"
                )}
              >
                <span className="block font-mono text-lg font-bold">{h.label.split(" ")[0]}D</span>
                <span className={cn("block text-[10px] mt-0.5", forecastHorizon === h.value ? "text-blue-100" : "text-text-muted")}>
                  {h.desc.split("·")[0].trim()}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-surface2 border border-border px-3 py-2">
            <p className="text-xs text-text-muted">
              Selected: <strong className="text-navy-900">{HORIZONS.find(h => h.value === forecastHorizon)?.desc}</strong>
            </p>
          </div>
        </SectionCard>

        {/* Optimization objective */}
        <SectionCard title="Optimization Objective">
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map((obj) => (
              <button
                key={obj.value}
                onClick={() => setPreference(obj.value)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-all",
                  preference === obj.value
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/30"
                    : "border-border hover:border-border-strong hover:bg-surface2"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy-900 capitalize">{obj.label}</span>
                  {preference === obj.value && <CheckCircle2 size={12} className="text-blue-600" />}
                </div>
                <p className="mt-0.5 text-[11px] text-text-muted">{obj.desc}</p>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Simulation trigger */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Run Simulation</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Executes all 8 engine blocks: environment → icebergs → hazards → vessel → routes → mitigations → consequence → POLARIS.
            </p>
          </div>
          <button
            onClick={runSimulation}
            disabled={simulationStatus === "running"}
            className={cn(
              "shrink-0 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all",
              simulationStatus === "running"
                ? "bg-navy-700 opacity-70 cursor-not-allowed"
                : "bg-navy-900 hover:bg-navy-800 shadow-sm"
            )}
          >
            {simulationStatus === "running" ? (
              <>
                <RotateCw size={15} className="animate-spin" />
                {simulationProgress}%
              </>
            ) : (
              <>
                <Zap size={15} />
                Generate Mission Analysis
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        {simulationStatus === "running" && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>Simulation progress</span>
              <span>{simulationProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-[10px] text-text-subtle">
              <span className={simulationProgress >= 40 ? "text-risk-low font-semibold" : ""}>Phase 1: Env + Icebergs</span>
              <span className={simulationProgress >= 80 ? "text-risk-low font-semibold" : ""}>Phase 2: Routes + Risk</span>
              <span className={simulationProgress >= 100 ? "text-risk-low font-semibold" : ""}>Phase 3: Complete</span>
            </div>
          </div>
        )}

        {/* Completion state */}
        {simulationStatus === "completed" && (
          <div className="mt-4 animate-fade-in">
            <div className="flex items-center gap-2 rounded-lg border border-risk-low/30 bg-risk-low-bg px-4 py-3">
              <CheckCircle2 size={15} className="shrink-0 text-risk-low" />
              <p className="text-sm font-semibold text-risk-low">
                Analysis complete — {routes.length} route alternatives ready.
              </p>
              <Link
                href="/routes"
                className="ml-auto flex items-center gap-1 text-xs font-semibold text-risk-low underline-offset-2 hover:underline"
              >
                View routes <ChevronRight size={12} />
              </Link>
            </div>

            {/* Route preview cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {routes.map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-surface2 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-navy-900">{r.name}</span>
                    <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold", riskBadge(r.averageRiskScore))}>
                      {r.averageRiskScore}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-text-muted space-y-0.5">
                    <p>{formatNauticalMiles(r.distanceNm)} · {formatHours(r.etaHours)}</p>
                    <p>Fuel: {formatFuelTons(r.fuelTons)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
