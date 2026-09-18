"use client";

import { useState } from "react";
import {
  Waves,
  Compass,
  Layers,
  Ship,
  Route,
  SlidersHorizontal,
  Grid,
  Award,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationStatus } from "@/components/session/MissionContext";

export interface StageDefinition {
  id: number;
  name: string;
  code: string;
  subtitle: string;
  icon: React.ElementType;
  nominalDurationMs: number;
  summary: string;
  inputs: string[];
  outputs: string[];
  formula: string;
  telemetryKey: string;
  telemetryValue: string;
}

export const ENGINE_STAGES: StageDefinition[] = [
  {
    id: 1,
    name: "Metocean & Sea Ice Dynamics",
    code: "ENG-01-MET",
    subtitle: "Thermodynamic ice growth & dynamic drift field simulation",
    icon: Waves,
    nominalDurationMs: 240,
    summary:
      "Assimilates ERA5 reanalysis and Sentinel-1 SAR imagery to compute high-resolution sea ice concentration and compressive drift velocity vectors.",
    inputs: [
      "ECMWF 10m Wind Vectors (18.4 kn, 215° SW)",
      "Sentinel-1 SAR Radar Grids (1km res)",
      "Sea Surface Temperature (-1.8°C)",
    ],
    outputs: [
      "Dynamic Concentration Raster (Peak 78.4%)",
      "Drift Velocity Tensor (0.42 kn SE)",
      "Compressive Ridge Formation Vector",
    ],
    formula: "∂h/∂t + ∇·(v_ice · h) = S_therm + S_dyn",
    telemetryKey: "Peak Ice Concentration",
    telemetryValue: "78.4% (Consolidated Pack)",
  },
  {
    id: 2,
    name: "Iceberg Drift & CPA Vectors",
    code: "ENG-02-CPA",
    subtitle: "Runge-Kutta 4th order hydrodynamic berg drift & CPA",
    icon: Compass,
    nominalDurationMs: 280,
    summary:
      "Calculates Closest Point of Approach (CPA) and Time-to-CPA (TCPA) for tabular icebergs B1-B4 incorporating wind drag and coriolis force.",
    inputs: [
      "4 Monitored Tabular Icebergs (B1–B4)",
      "Waterline Drafts & Sail Areas (180–320m)",
      "Subsurface Geostrophic Current Layer",
    ],
    outputs: [
      "Minimum CPA Distance: 2.4 NM (Target ≥ 2.0 NM)",
      "TCPA Standoff Time: +4.2 hrs",
      "Dynamic Avoidance Safety Corridors",
    ],
    formula: "d(t) = |r_vessel(t) - r_berg(t)|,  CPA = min_{t} d(t)",
    telemetryKey: "Min Iceberg Standoff",
    telemetryValue: "2.4 NM (B2 Vector Clearance)",
  },
  {
    id: 3,
    name: "Spatial Hazard Zone Polygons",
    code: "ENG-03-HAZ",
    subtitle: "Deformation ridges & multi-year ice floe boundaries",
    icon: Layers,
    nominalDurationMs: 210,
    summary:
      "Identifies spatial hazard polygons from satellite roughness indices, establishing 2.0 NM safety standoff corridors around severe pressure ridges.",
    inputs: [
      "RADARSAT Multi-Year Ice Roughness Mask",
      "Antarctic Peninsula Shear Stress Map",
      "Fast-Ice Landfast Boundary Polygons",
    ],
    outputs: [
      "2 Active Hazard Polygons (PR-01, MYI-02)",
      "Buffer Exclusion Corridors (2.0 NM Margin)",
      "Penetration Penalty Weights (λ = 4.8)",
    ],
    formula: "H_poly = ⋃ (P_ridge ⊕ B_standoff(2.0 NM))",
    telemetryKey: "Monitored Hazard Polygons",
    telemetryValue: "2 Zones Buffered (Standoff: 2.0 NM)",
  },
  {
    id: 4,
    name: "Vessel Polar Class Limits",
    code: "ENG-04-POL",
    subtitle: "IMO Polar Code structural limit & operational envelope",
    icon: Ship,
    nominalDurationMs: 190,
    summary:
      "Evaluates vessel hull plating yield stress against prevailing ice thickness to compute maximum allowable transit speed and ramming limits.",
    inputs: [
      "Vessel Polar Class (PC2 to PC7 / OpenWater)",
      "Bow Plating Yield Rating (DNV Polar Ice)",
      "Displacement & Installed Icebreaking Power",
    ],
    outputs: [
      "Maximum Ice Speed Bound: 11.2 kn",
      "Ramming Prohibited Directive (Enforced)",
      "Power Consumption Penalty Profile",
    ],
    formula: "v_{safe} = v_{limit} · min(1.0, (1 - C_{ice})^{1.15})",
    telemetryKey: "Safe Hull Speed Cap",
    telemetryValue: "11.2 kn Max (Structural Limit)",
  },
  {
    id: 5,
    name: "Multi-Objective A* Pathfinding",
    code: "ENG-05-AST",
    subtitle: "Pareto-optimal 4D space-time graph traversal",
    icon: Route,
    nominalDurationMs: 360,
    summary:
      "Explores space-time lattice evaluating 4,820 frontier nodes to synthesize 4 Pareto-optimal candidate trajectories (Shortest, Safest, Fuel, Balanced).",
    inputs: [
      "4D Spatio-Temporal Cost Lattice (1000×650)",
      "Multi-Objective Heuristic Weights (w_risk, w_fuel, w_eta)",
      "Waypoint Standoff Constraints",
    ],
    outputs: [
      "4 Distinct Pareto Trajectories (412 to 528 NM)",
      "Frontier Nodes Explored: 4,820 (142 Pruned)",
      "Dynamic Route Convergence in 360ms",
    ],
    formula: "f(n) = g(n) + h(n),  J = w_R·R(p) + w_F·F(p) + w_T·T(p)",
    telemetryKey: "Frontier Nodes Evaluated",
    telemetryValue: "4,820 Nodes (142 Pruned)",
  },
  {
    id: 6,
    name: "Tactical Mitigation Synthesis",
    code: "ENG-06-MIT",
    subtitle: "Automated rule-engine tactical countermeasures",
    icon: SlidersHorizontal,
    nominalDurationMs: 220,
    summary:
      "Synthesizes 7 actionable operational mitigations spanning night transit lookouts, speed throttling in pack ice, and thermal FLIR scanning.",
    inputs: [
      "Candidate Trajectory Hazard Intersections",
      "Night & Twilight Polar Visibility Windows",
      "Strait Navigation Narrow Chokepoints",
    ],
    outputs: [
      "7 Actionable Mitigations (2 Mandatory, 3 Rec, 2 Adv)",
      "Speed Reduction Directive in >6/10 Ice",
      "Thermal Infrared FLIR Continuous Watch",
    ],
    formula: "M_{synth} = Ruleset(Intersections, IceClass, DayNight)",
    telemetryKey: "Mitigation Directives",
    telemetryValue: "7 Tactical Actions Synthesized",
  },
  {
    id: 7,
    name: "Consequence & Besetment Matrix",
    code: "ENG-07-CON",
    subtitle: "Monte Carlo besetment probability & hull stress model",
    icon: Grid,
    nominalDurationMs: 310,
    summary:
      "Simulates 1,000 Monte Carlo runs to determine vessel besetment probability and compressive ice trapping risk across all waypoints.",
    inputs: [
      "Ice Convergence & Shear Pressure Tensor",
      "Vessel Power-to-Displacement Ratio (kW/t)",
      "Stuck Time Recovery Probability Model",
    ],
    outputs: [
      "Besetment Probability: 18.4% (Acceptable)",
      "Average Voyage Hull Risk Score: 31/100",
      "Compressive Trapping Risk Index: 0.22",
    ],
    formula: "P_{beset} = 1 - \\exp(-k · C_{ice} · P_{comp} / (P_{kW}/Δ))",
    telemetryKey: "Besetment Probability",
    telemetryValue: "18.4% (Low-Medium Bound)",
  },
  {
    id: 8,
    name: "POLARIS RIO Certification",
    code: "ENG-08-RIO",
    subtitle: "IMO Polar Operational Limit Assessment Risk Indexing",
    icon: Award,
    nominalDurationMs: 250,
    summary:
      "Computes Risk Index Outcome (RIO) pursuant to IMO MSC.1/Circ.1519 for Polar Code regulatory compliance certification.",
    inputs: [
      "Risk Index Values (RIV) per Ice Type & Thickness",
      "Vessel Structural Polar Class Certification",
      "Segment Ice Concentration Distributions",
    ],
    outputs: [
      "Polaris RIO Score: +16.8 (Authorized Operation)",
      "Regulatory Compliance Status: PASS",
      "Voyage Operational Clearance Document",
    ],
    formula: "RIO = \\sum (C_i · RIV_i) \\ge 0 \\implies Authorized",
    telemetryKey: "POLARIS RIO Score",
    telemetryValue: "+16.8 RIO (IMO PASS Certified)",
  },
];

interface SimulationPipelineProps {
  simulationStatus: SimulationStatus;
  simulationProgress: number;
  activeStageIndex?: number;
  onSelectStage?: (stageId: number) => void;
}

export function SimulationPipeline({
  simulationStatus,
  simulationProgress,
  activeStageIndex,
  onSelectStage,
}: SimulationPipelineProps) {
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);

  // Compute status for each stage based on simulation progress
  const getStageStatus = (stageIdx: number): "pending" | "active" | "complete" => {
    if (simulationStatus === "completed") return "complete";
    if (simulationStatus === "idle") return "pending";

    // When running, partition 100% into 8 slices (~12.5% each)
    const stageStartPct = stageIdx * 12.5;
    const stageEndPct = (stageIdx + 1) * 12.5;

    if (simulationProgress >= stageEndPct) {
      return "complete";
    }
    if (simulationProgress >= stageStartPct) {
      return "active";
    }
    return "pending";
  };

  const toggleExpand = (stageId: number) => {
    setExpandedStageId((prev) => (prev === stageId ? null : stageId));
    onSelectStage?.(stageId);
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-navy-900 text-white">
              <Cpu size={12} />
            </span>
            <h2 className="text-sm font-bold text-navy-900">
              8-Engine-Block Simulation Pipeline
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Sequential multi-physics analysis pipeline executing Arctic & Antarctic hydro-ice kinematics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {simulationStatus === "running" && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 animate-pulse">
              <RotateCw size={12} className="animate-spin" />
              Pipeline Executing ({simulationProgress}%)
            </span>
          )}
          {simulationStatus === "completed" && (
            <span className="flex items-center gap-1.5 rounded-full bg-risk-low-bg border border-risk-low/40 px-2.5 py-1 text-xs font-semibold text-risk-low">
              <CheckCircle2 size={13} />
              All 8 Blocks Converged
            </span>
          )}
          {simulationStatus === "idle" && (
            <span className="flex items-center gap-1.5 rounded-full bg-surface2 border border-border px-2.5 py-1 text-xs font-semibold text-text-muted">
              <Clock size={12} />
              Ready to Execute
            </span>
          )}
        </div>
      </div>

      {/* 8-Stage Grid */}
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {ENGINE_STAGES.map((stage, idx) => {
          const status = getStageStatus(idx);
          const isExpanded = expandedStageId === stage.id;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={cn(
                "group relative rounded-lg border transition-all duration-200 overflow-hidden",
                status === "active"
                  ? "border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/30"
                  : status === "complete"
                  ? "border-risk-low/40 bg-surface2/90 hover:border-risk-low/70"
                  : "border-border bg-surface/80 opacity-75 hover:opacity-100 hover:border-border-strong"
              )}
            >
              {/* Active pulse accent bar */}
              {status === "active" && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-400 animate-pulse" />
              )}
              {status === "complete" && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-risk-low" />
              )}

              {/* Card button header */}
              <button
                type="button"
                onClick={() => toggleExpand(stage.id)}
                className="w-full p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                aria-expanded={isExpanded}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                        status === "active"
                          ? "bg-blue-600 text-white shadow-xs"
                          : status === "complete"
                          ? "bg-risk-low/20 text-risk-low border border-risk-low/30"
                          : "bg-surface text-text-muted border border-border"
                      )}
                    >
                      <Icon size={14} className={status === "active" ? "animate-pulse" : ""} />
                    </span>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-text-subtle tracking-wider uppercase">
                        {stage.code}
                      </span>
                      <h3 className="text-xs font-bold text-navy-900 leading-tight">
                        {stage.name}
                      </h3>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="shrink-0">
                    {status === "complete" ? (
                      <span className="flex items-center gap-1 rounded bg-risk-low-bg px-1.5 py-0.5 font-mono text-[10px] font-bold text-risk-low border border-risk-low/30">
                        <CheckCircle2 size={10} />
                        {(stage.nominalDurationMs / 1000).toFixed(2)}s
                      </span>
                    ) : status === "active" ? (
                      <span className="flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs animate-pulse">
                        <RotateCw size={10} className="animate-spin" />
                        Active
                      </span>
                    ) : (
                      <span className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-text-subtle border border-border">
                        Queued
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                  {stage.subtitle}
                </p>

                {/* Key live telemetry chip */}
                <div className="mt-2.5 flex items-center justify-between rounded bg-surface border border-border/80 px-2 py-1">
                  <span className="font-mono text-[9px] text-text-subtle uppercase">
                    {stage.telemetryKey}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold",
                      status === "complete"
                        ? "text-risk-low"
                        : status === "active"
                        ? "text-blue-600"
                        : "text-text-muted"
                    )}
                  >
                    {status === "pending" ? "—" : stage.telemetryValue}
                  </span>
                </div>

                {/* Expand toggle chevron */}
                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-text-subtle">
                  <span>{isExpanded ? "Collapse inspect" : "Inspect formulas"}</span>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </button>

              {/* Expandable details drawer */}
              {isExpanded && (
                <div className="border-t border-border bg-surface p-3 text-xs animate-fade-in">
                  <p className="text-[11px] text-text-secondary mb-2 leading-relaxed">
                    {stage.summary}
                  </p>

                  <div className="mb-2 rounded bg-surface2 p-2 border border-border font-mono text-[10px]">
                    <div className="text-text-subtle font-semibold mb-0.5 flex items-center gap-1">
                      <Info size={11} />
                      Governing Formulation:
                    </div>
                    <code className="text-navy-900 font-bold break-all">{stage.formula}</code>
                  </div>

                  <div className="space-y-1.5 text-[10px]">
                    <div>
                      <span className="font-semibold text-text-muted block">Inputs:</span>
                      <ul className="list-disc list-inside text-text-secondary pl-1 space-y-0.5">
                        {stage.inputs.map((inp) => (
                          <li key={inp} className="truncate">{inp}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-semibold text-text-muted block">Outputs:</span>
                      <ul className="list-disc list-inside text-text-secondary pl-1 space-y-0.5">
                        {stage.outputs.map((out) => (
                          <li key={out} className="truncate">{out}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
