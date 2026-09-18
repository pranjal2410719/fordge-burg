"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RotateCw,
  CheckCircle2,
  ChevronRight,
  Zap,
  Sparkles,
  Cpu,
  Ship,
  Compass,
  Layers,
  MapPin,
  Clock,
  Flame,
  Shield,
  Sliders,
  Play,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useMission } from "@/components/session/MissionContext";
import {
  MISSIONS,
  VESSELS,
  type ForecastHorizon,
  type OptimizationPreference,
  type RouteId,
} from "@/lib/data";
import { cn, formatNauticalMiles, formatHours, formatFuelTons, riskBadge } from "@/lib/utils";

import { ParameterStepper } from "@/components/mission/ParameterStepper";
import { SimulationPipeline } from "@/components/mission/SimulationPipeline";
import { SimulationTelemetryHud } from "@/components/mission/SimulationTelemetryHud";
import { SimulationPreviewMap } from "@/components/mission/SimulationPreviewMap";
import { RouteRevealCards } from "@/components/mission/RouteRevealCards";

const HORIZONS: { value: ForecastHorizon; label: string; desc: string; detail: string }[] = [
  { value: 1, label: "1 Day", desc: "24 h · Low uncertainty", detail: "Near-real-time satellite SAR assimilation" },
  { value: 3, label: "3 Days", desc: "72 h · Moderate uncertainty", detail: "Medium-range dynamic icepack drift" },
  { value: 7, label: "7 Days", desc: "168 h · High uncertainty", detail: "Ensemble synoptic weather forecast" },
];

const OBJECTIVES: {
  value: OptimizationPreference;
  label: string;
  desc: string;
  icon: React.ElementType;
  badge: string;
}[] = [
  {
    value: "balanced",
    label: "Balanced",
    desc: "Pareto-optimal trade-off of risk, fuel burn, and voyage ETA",
    icon: Sparkles,
    badge: "Recommended",
  },
  {
    value: "safety",
    label: "Safety",
    desc: "Maximum iceberg standoff & lowest compressive pack ice exposure",
    icon: Shield,
    badge: "Max Standoff",
  },
  {
    value: "fuel",
    label: "Fuel",
    desc: "Minimum bunker consumption along hydrodynamic leads",
    icon: Flame,
    badge: "Min Bunker",
  },
  {
    value: "time",
    label: "Time",
    desc: "Fastest ETA traversing direct navigable leads",
    icon: Clock,
    badge: "Fastest ETA",
  },
];

function SectionCard({
  id,
  title,
  subtitle,
  badge,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-6 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900">{title}</h2>
          {subtitle && <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="rounded-full bg-surface2 border border-border px-2 py-0.5 font-mono text-[10px] font-semibold text-text-muted">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function MissionPage() {
  const {
    mission,
    vessel,
    forecastHorizon,
    preference,
    selectedRouteId,
    setSelectedRouteId,
    setMissionId,
    setVesselId,
    setHorizon,
    setPreference,
    simulationStatus,
    simulationProgress,
    runSimulation,
    routes,
  } = useMission();

  const [activeTab, setActiveTab] = useState<"split" | "map" | "hud">("split");

  return (
    <AppShell>
      {/* Header and Mission Planner Intro */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-navy-900 text-white shadow-xs">
              <Compass size={14} />
            </span>
            <h1 className="text-xl font-bold text-navy-900">Mission Planner & Simulation Engine</h1>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Configure polar voyage parameters, execute the 8-block hydrodynamic calculation pipeline, and evaluate Pareto route alternatives.
          </p>
        </div>

        {/* Quick run trigger in header */}
        <div className="flex items-center gap-2">
          {simulationStatus === "completed" && (
            <Link
              href="/routes"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-navy-900 hover:bg-surface2 hover:border-border-strong transition-colors"
            >
              Route Optimizer
              <ArrowRight size={13} />
            </Link>
          )}

          <button
            type="button"
            onClick={runSimulation}
            disabled={simulationStatus === "running"}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all shadow-sm cursor-pointer",
              simulationStatus === "running"
                ? "bg-navy-700 opacity-80 cursor-not-allowed"
                : "bg-navy-900 hover:bg-navy-800"
            )}
          >
            {simulationStatus === "running" ? (
              <>
                <RotateCw size={13} className="animate-spin" />
                Simulating ({simulationProgress}%)
              </>
            ) : (
              <>
                <Zap size={13} />
                {simulationStatus === "completed" ? "Re-run Simulation" : "Run Simulation"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern Interactive Parameter Stepper */}
      <div className="mb-6">
        <ParameterStepper
          missionName={mission.name}
          missionRoute={`${mission.origin} → ${mission.destination}`}
          vesselName={vessel.name}
          vesselClass={vessel.iceClass}
          horizonDays={forecastHorizon}
          objectiveName={preference}
          simulationStatus={simulationStatus}
          simulationProgress={simulationProgress}
        />
      </div>

      {/* 4-Card Parameter Configuration Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Mission Scenario */}
        <SectionCard
          id="step-scenario"
          title="1 · Mission Scenario"
          subtitle="Pre-computed Antarctic scientific & logistics corridors"
          badge={`${MISSIONS.length} Available`}
        >
          <div className="flex flex-col gap-2">
            {MISSIONS.map((m) => {
              const isSelected = mission.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMissionId(m.id)}
                  className={cn(
                    "group w-full rounded-lg border p-3.5 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/30 shadow-xs"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                      {m.name}
                    </span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                        <CheckCircle2 size={13} />
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-blue-600" />
                      {m.origin} → {m.destination}
                    </span>
                    <span className="font-bold text-navy-800">
                      {formatNauticalMiles(m.distanceNm)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* 2. Vessel Profile */}
        <SectionCard
          id="step-vessel"
          title="2 · Vessel Polar Class Profile"
          subtitle="Structural hull rating & icebreaking envelope"
          badge="5 Fleet Archetypes"
        >
          <div className="flex flex-col gap-2">
            {VESSELS.map((v) => {
              const isSelected = vessel.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVesselId(v.id)}
                  className={cn(
                    "group w-full rounded-lg border p-3.5 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/30 shadow-xs"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                        {v.name}
                      </span>
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold",
                          v.iceClass === "PC2"
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : v.iceClass === "PC4"
                            ? "border-risk-low/40 bg-risk-low-bg text-risk-low"
                            : v.iceClass === "PC5"
                            ? "border-risk-med/40 bg-risk-med-bg text-risk-med"
                            : "border-risk-high/40 bg-risk-high-bg text-risk-high"
                        )}
                      >
                        {v.iceClass}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                        <CheckCircle2 size={13} />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs font-mono text-text-muted">
                    <span>
                      LOA {v.loaM}m · Beam {v.beamM}m · Draft {v.draftM}m
                    </span>
                    <span className="font-semibold text-navy-800">
                      Ice Cap: {v.iceLimitKn} kn · {v.fuelTonsPerDay} MT/d
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* 3. Forecast Horizon */}
        <SectionCard
          id="step-horizon"
          title="3 · Forecast Horizon Window"
          subtitle="Dynamic metocean assimilation & uncertainty model"
          badge="Atmospheric Window"
        >
          <div className="grid grid-cols-3 gap-2">
            {HORIZONS.map((h) => {
              const isSelected = forecastHorizon === h.value;
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHorizon(h.value)}
                  className={cn(
                    "rounded-xl border p-3.5 text-center transition-all cursor-pointer",
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface2"
                  )}
                >
                  <span className="block font-mono text-xl font-bold">
                    {h.label.split(" ")[0]}D
                  </span>
                  <span
                    className={cn(
                      "block text-xs font-semibold mt-1",
                      isSelected ? "text-blue-100" : "text-navy-900"
                    )}
                  >
                    {h.label}
                  </span>
                  <span
                    className={cn(
                      "block text-[10px] mt-0.5 truncate",
                      isSelected ? "text-blue-200" : "text-text-muted"
                    )}
                  >
                    {h.desc.split("·")[0].trim()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg bg-surface2 border border-border px-3.5 py-2.5 flex items-center justify-between text-xs">
            <span className="text-text-muted">
              Model assimilation:{" "}
              <strong className="text-navy-900">
                {HORIZONS.find((h) => h.value === forecastHorizon)?.detail}
              </strong>
            </span>
            <span className="font-mono font-bold text-blue-600">
              {forecastHorizon * 24} Hours
            </span>
          </div>
        </SectionCard>

        {/* 4. Optimization Objective */}
        <SectionCard
          id="step-objective"
          title="4 · Optimization Objective"
          subtitle="Pareto weighting function across risk, fuel, and ETA"
          badge="Pareto Multi-Objective"
        >
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map((obj) => {
              const isSelected = preference === obj.value;
              const Icon = obj.icon;
              return (
                <button
                  key={obj.value}
                  type="button"
                  onClick={() => setPreference(obj.value)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left transition-all cursor-pointer flex flex-col justify-between",
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/30 shadow-xs"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface2"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md",
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-surface2 text-text-muted border border-border"
                          )}
                        >
                          <Icon size={13} />
                        </span>
                        <span className="text-xs font-bold text-navy-900">{obj.label}</span>
                      </div>
                      {isSelected && <CheckCircle2 size={13} className="text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
                      {obj.desc}
                    </p>
                  </div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold",
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-surface2 text-text-subtle border border-border"
                      )}
                    >
                      {obj.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Section 5: Simulation Trigger Deck */}
      <div id="step-simulation" className="scroll-mt-6 mt-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Zap size={14} />
              </span>
              <h2 className="text-sm font-bold text-navy-900">
                Execute Mission Simulation Pipeline
              </h2>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Runs the full multi-physics simulation: Metocean → Icebergs → Hazards → Vessel Class → Multi-Objective A* → Mitigations → Besetment → POLARIS RIO.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runSimulation}
              disabled={simulationStatus === "running"}
              className={cn(
                "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all shadow-md cursor-pointer",
                simulationStatus === "running"
                  ? "bg-navy-700 opacity-80 cursor-not-allowed"
                  : "bg-navy-900 hover:bg-navy-800 hover:scale-[1.01]"
              )}
            >
              {simulationStatus === "running" ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  Computing Pipeline ({simulationProgress}%)
                </>
              ) : (
                <>
                  <Zap size={16} />
                  {simulationStatus === "completed"
                    ? "Re-run Mission Analysis"
                    : "Generate Mission Analysis"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar when Running */}
        {simulationStatus === "running" && (
          <div className="mt-4 animate-fade-in">
            <div className="flex justify-between text-xs font-mono font-semibold text-text-muted mb-1.5">
              <span className="flex items-center gap-1.5 text-blue-600">
                <RotateCw size={12} className="animate-spin" />
                Executing Sequential Engine Blocks...
              </span>
              <span className="text-navy-900">{simulationProgress}% Complete</span>
            </div>
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 transition-all duration-300 shadow-xs"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap justify-between text-[10px] font-mono text-text-subtle">
              <span className={simulationProgress >= 25 ? "text-blue-600 font-bold" : ""}>
                1-2: Metocean & Icebergs
              </span>
              <span className={simulationProgress >= 50 ? "text-blue-600 font-bold" : ""}>
                3-4: Hazards & Vessel Limits
              </span>
              <span className={simulationProgress >= 75 ? "text-blue-600 font-bold" : ""}>
                5-6: A* Routes & Mitigations
              </span>
              <span className={simulationProgress >= 100 ? "text-risk-low font-bold" : ""}>
                7-8: Besetment & POLARIS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 8-Engine-Block Pipeline Animation Component */}
      <div className="mt-4">
        <SimulationPipeline
          simulationStatus={simulationStatus}
          simulationProgress={simulationProgress}
        />
      </div>

      {/* Visual Simulation Cockpit Header */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-navy-900 text-white">
            <Cpu size={12} />
          </span>
          <h2 className="text-sm font-bold text-navy-900">
            Real-Time Visual Simulation Cockpit
          </h2>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-1 bg-surface2 border border-border rounded-lg p-0.5 text-xs font-semibold text-text-muted">
          <button
            type="button"
            onClick={() => setActiveTab("split")}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
              activeTab === "split" ? "bg-surface text-navy-900 shadow-xs" : "hover:text-navy-900"
            )}
          >
            Split Cockpit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
              activeTab === "map" ? "bg-surface text-navy-900 shadow-xs" : "hover:text-navy-900"
            )}
          >
            Polar Map Only
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hud")}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
              activeTab === "hud" ? "bg-surface text-navy-900 shadow-xs" : "hover:text-navy-900"
            )}
          >
            Telemetry HUD Only
          </button>
        </div>
      </div>

      {/* Visual Simulation Cockpit (Responsive Map & Telemetry HUD) */}
      <div className="mt-3 grid gap-4 lg:grid-cols-12">
        {(activeTab === "split" || activeTab === "map") && (
          <div className={cn(activeTab === "map" ? "lg:col-span-12" : "lg:col-span-7")}>
            <SimulationPreviewMap
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id: RouteId) => setSelectedRouteId(id)}
              simulationStatus={simulationStatus}
              simulationProgress={simulationProgress}
            />
          </div>
        )}

        {(activeTab === "split" || activeTab === "hud") && (
          <div className={cn(activeTab === "hud" ? "lg:col-span-12" : "lg:col-span-5")}>
            <SimulationTelemetryHud
              simulationStatus={simulationStatus}
              simulationProgress={simulationProgress}
            />
          </div>
        )}
      </div>

      {/* Staggered Animated Reveal for Route Alternatives */}
      {simulationStatus === "completed" && (
        <RouteRevealCards
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id: RouteId) => setSelectedRouteId(id)}
          onResimulate={runSimulation}
          preference={preference}
        />
      )}
    </AppShell>
  );
}
