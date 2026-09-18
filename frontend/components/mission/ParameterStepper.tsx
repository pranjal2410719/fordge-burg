"use client";

import { CheckCircle2, ChevronRight, Play, Check, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationStatus } from "@/components/session/MissionContext";

interface ParameterStepperProps {
  activeStep?: number;
  onStepClick?: (step: number) => void;
  missionName: string;
  missionRoute: string;
  vesselName: string;
  vesselClass: string;
  horizonDays: number;
  objectiveName: string;
  simulationStatus: SimulationStatus;
  simulationProgress: number;
}

export function ParameterStepper({
  activeStep = 5,
  onStepClick,
  missionName,
  missionRoute,
  vesselName,
  vesselClass,
  horizonDays,
  objectiveName,
  simulationStatus,
  simulationProgress,
}: ParameterStepperProps) {
  const steps = [
    {
      id: 1,
      title: "Scenario",
      label: "1 · Scenario",
      badge: missionName.split(" ")[0] || "Weddell",
      chip: missionRoute || "Maxwell → Weddell",
      targetId: "step-scenario",
      isConfigured: Boolean(missionName),
    },
    {
      id: 2,
      title: "Vessel",
      label: "2 · Vessel",
      badge: vesselClass || "PC2",
      chip: vesselName.split(" ").slice(-1)[0] || "Charcot",
      targetId: "step-vessel",
      isConfigured: Boolean(vesselName),
    },
    {
      id: 3,
      title: "Horizon",
      label: "3 · Horizon",
      badge: `${horizonDays}D`,
      chip: `${horizonDays * 24}h Window`,
      targetId: "step-horizon",
      isConfigured: horizonDays > 0,
    },
    {
      id: 4,
      title: "Objective",
      label: "4 · Objective",
      badge: objectiveName.charAt(0).toUpperCase() + objectiveName.slice(1),
      chip: "Pareto Weighted",
      targetId: "step-objective",
      isConfigured: Boolean(objectiveName),
    },
    {
      id: 5,
      title: "Run",
      label: "5 · Run Engine",
      badge:
        simulationStatus === "completed"
          ? "Complete"
          : simulationStatus === "running"
          ? `${simulationProgress}%`
          : "Ready",
      chip:
        simulationStatus === "completed"
          ? "4 Routes"
          : simulationStatus === "running"
          ? "Computing"
          : "8 Blocks",
      targetId: "step-simulation",
      isConfigured: simulationStatus === "completed",
    },
  ];

  const handleStepClick = (stepId: number, targetId: string) => {
    onStepClick?.(stepId);
    if (typeof document !== "undefined") {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
            Voyage Configuration Workflow
          </span>
          <span className="rounded-full bg-surface2 border border-border px-2 py-0.5 text-[10px] font-semibold text-text-muted">
            5 / 5 Configured
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted font-mono">
          <span className="flex items-center gap-1 text-blue-600 font-semibold">
            <Sparkles size={13} />
            IMO POLARIS v2.4 Engine
          </span>
          {simulationStatus === "running" && (
            <span className="flex items-center gap-1 text-risk-med font-semibold animate-pulse">
              <Clock size={12} />
              Simulating ({simulationProgress}%)
            </span>
          )}
          {simulationStatus === "completed" && (
            <span className="flex items-center gap-1 text-risk-low font-semibold">
              <CheckCircle2 size={13} />
              Ready for Route Selection
            </span>
          )}
        </div>
      </div>

      {/* Stepper items */}
      <nav aria-label="Mission Configuration Steps" className="mt-3.5">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {steps.map((step, idx) => {
            const isRunStep = step.id === 5;
            const isCompleted = step.id < 5 ? step.isConfigured : simulationStatus === "completed";
            const isRunning = isRunStep && simulationStatus === "running";

            return (
              <li key={step.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id, step.targetId)}
                  className={cn(
                    "group w-full rounded-lg border p-2.5 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                    isRunStep && simulationStatus === "completed"
                      ? "border-risk-low/50 bg-risk-low-bg/60 ring-1 ring-risk-low/30"
                      : isRunning
                      ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/40 shadow-sm"
                      : isRunStep
                      ? "border-blue-300/80 bg-blue-50/30 hover:border-blue-500"
                      : "border-border hover:border-border-strong hover:bg-surface2"
                  )}
                  aria-current={activeStep === step.id ? "step" : undefined}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-navy-900 group-hover:text-blue-600 transition-colors">
                      {step.label}
                    </span>
                    {isCompleted ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-risk-low text-white text-[9px] shadow-xs">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    ) : isRunning ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[9px] animate-spin">
                        <Play size={8} fill="white" />
                      </span>
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface text-[10px] text-text-subtle">
                        {step.id}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                        isRunStep && simulationStatus === "completed"
                          ? "bg-risk-low/15 text-risk-low border border-risk-low/30"
                          : isRunning
                          ? "bg-blue-600 text-white"
                          : "bg-surface2 text-navy-800 border border-border"
                      )}
                    >
                      {step.badge}
                    </span>
                    <span className="text-[10px] text-text-muted truncate max-w-[90px]">
                      {step.chip}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
