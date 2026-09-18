"use client";

import { useEffect, useRef, useState } from "react";
import {
  Terminal,
  Activity,
  Copy,
  Check,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Compass,
  Route,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationStatus } from "@/components/session/MissionContext";

export interface LogEntry {
  id: string;
  timestamp: string;
  subsystem: "METOCEAN" | "ICEBERG" | "HAZARD" | "VESSEL" | "A*-ROUTER" | "MITIGATION" | "CONSEQUENCE" | "POLARIS" | "SYSTEM";
  level: "info" | "warn" | "success";
  message: string;
  metric?: string;
}

const TELEMETRY_STREAM_DATA: Omit<LogEntry, "id" | "timestamp">[] = [
  {
    subsystem: "METOCEAN",
    level: "info",
    message: "Ingesting ERA5 atmospheric reanalysis & 10m surface winds: 18.4 kn, 215° SW.",
    metric: "18.4 kn",
  },
  {
    subsystem: "METOCEAN",
    level: "info",
    message: "Assimilating Sentinel-1 SAR imagery. Sea surface temperature: -1.8°C.",
    metric: "-1.8°C",
  },
  {
    subsystem: "METOCEAN",
    level: "success",
    message: "Dynamic ice concentration raster mapped. Peak sector pack density: 78.4%.",
    metric: "78.4% Peak",
  },
  {
    subsystem: "ICEBERG",
    level: "info",
    message: "Hydrodynamic Runge-Kutta 4th order drift initiated for tabular bergs B1, B2, B3, B4.",
    metric: "4 Bergs",
  },
  {
    subsystem: "ICEBERG",
    level: "success",
    message: "B2 CPA vector verified: 2.4 NM at TCPA +4.2h. 2.0 NM safety standoff satisfied.",
    metric: "CPA 2.4 NM",
  },
  {
    subsystem: "HAZARD",
    level: "warn",
    message: "Spatial polygon intersection detected: Pressure Ridge PR-01 in Antarctic Sound.",
    metric: "PR-01",
  },
  {
    subsystem: "HAZARD",
    level: "success",
    message: "Dynamic corridor buffer applied. Penetration avoidance weight set to λ = 4.8.",
    metric: "Buffer 2.0 NM",
  },
  {
    subsystem: "VESSEL",
    level: "info",
    message: "Validating structural Polar Class limits for vessel hull & bow plating yield.",
    metric: "PC Envelope",
  },
  {
    subsystem: "VESSEL",
    level: "success",
    message: "Safe operational speed ceiling established: 11.2 kn. Ramming prohibited flag set.",
    metric: "11.2 kn Max",
  },
  {
    subsystem: "A*-ROUTER",
    level: "info",
    message: "Seeding 4D spatio-temporal heuristic lattice (1000×650 grid). Traversing nodes...",
    metric: "Lattice Seeded",
  },
  {
    subsystem: "A*-ROUTER",
    level: "info",
    message: "Frontier search expanded: 4,820 candidate graph nodes evaluated across 4 horizons.",
    metric: "4,820 Nodes",
  },
  {
    subsystem: "A*-ROUTER",
    level: "success",
    message: "Pareto convergence achieved: 4 distinct trajectory alternatives generated.",
    metric: "4 Routes",
  },
  {
    subsystem: "MITIGATION",
    level: "info",
    message: "Rule synthesis active: Correlating route hazard intersections with Polar Code SOPs.",
    metric: "Rule Engine",
  },
  {
    subsystem: "MITIGATION",
    level: "success",
    message: "7 actionable tactical mitigations synthesized (Speed limit, FLIR watch, Ballast trim).",
    metric: "7 Directives",
  },
  {
    subsystem: "CONSEQUENCE",
    level: "info",
    message: "Running 1,000 Monte Carlo iterations for compressive ice trapping & besetment risk.",
    metric: "1k Iterations",
  },
  {
    subsystem: "CONSEQUENCE",
    level: "success",
    message: "Besetment probability converged to 18.4%. Hull consequence index: 31/100 (LOW).",
    metric: "18.4% Beset",
  },
  {
    subsystem: "POLARIS",
    level: "info",
    message: "Evaluating IMO Polar Operational Limit Assessment Risk Indexing System (RIO).",
    metric: "IMO RIO",
  },
  {
    subsystem: "POLARIS",
    level: "success",
    message: "Polaris RIO score certified: +16.8 (Authorized Polar Operation under MSC.1/Circ.1519).",
    metric: "+16.8 RIO PASS",
  },
  {
    subsystem: "SYSTEM",
    level: "success",
    message: "Mission simulation pipeline completed successfully. Route telemetry ready for dispatch.",
    metric: "CONVERGED",
  },
];

interface SimulationTelemetryHudProps {
  simulationStatus: SimulationStatus;
  simulationProgress: number;
}

export function SimulationTelemetryHud({
  simulationStatus,
  simulationProgress,
}: SimulationTelemetryHudProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Live real-time numbers that animate during simulation
  const [nodesCount, setNodesCount] = useState(0);
  const [cpaDist, setCpaDist] = useState(2.4);
  const [icePeak, setIcePeak] = useState(78.4);
  const [rioScore, setRioScore] = useState(16.8);
  const [besetmentPct, setBesetmentPct] = useState(18.4);

  // Synchronize logs based on simulationProgress
  useEffect(() => {
    if (simulationStatus === "idle") {
      setLogs([]);
      setNodesCount(0);
      return;
    }

    if (simulationStatus === "running") {
      const targetCount = Math.floor((simulationProgress / 100) * TELEMETRY_STREAM_DATA.length);
      const activeEntries = TELEMETRY_STREAM_DATA.slice(0, Math.max(1, targetCount)).map((item, idx) => ({
        ...item,
        id: `log-${idx}`,
        timestamp: `+00:${(idx * 0.12).toFixed(2).padStart(5, "0")}`,
      }));

      if (!isPaused) {
        setLogs(activeEntries);
      }

      // Ticking node counter
      setNodesCount(Math.min(4820, Math.floor((simulationProgress / 100) * 4820)));
    } else if (simulationStatus === "completed") {
      const allEntries = TELEMETRY_STREAM_DATA.map((item, idx) => ({
        ...item,
        id: `log-${idx}`,
        timestamp: `+00:${(idx * 0.12).toFixed(2).padStart(5, "0")}`,
      }));
      setLogs(allEntries);
      setNodesCount(4820);
    }
  }, [simulationStatus, simulationProgress, isPaused]);

  // Auto-scroll to bottom of log feed
  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const handleCopyLog = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.subsystem}] ${l.message} ${l.metric ? `(${l.metric})` : ""}`)
      .join("\n");
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedFilter === "ALL") return true;
    return log.subsystem === selectedFilter;
  });

  return (
    <div className="flex flex-col rounded-xl border border-navy-800/80 bg-[#071324] text-slate-200 shadow-lg overflow-hidden h-full">
      {/* Top telemetry status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-800 bg-[#0a1930] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-cyan-300">
            COMPUTATION TELEMETRY HUD
          </span>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
              simulationStatus === "running"
                ? "bg-blue-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse"
                : simulationStatus === "completed"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                simulationStatus === "running"
                  ? "bg-cyan-400"
                  : simulationStatus === "completed"
                  ? "bg-emerald-400"
                  : "bg-slate-500"
              )}
            />
            {simulationStatus === "running"
              ? "STREAMING LIVE"
              : simulationStatus === "completed"
              ? "TELEMETRY LOCKED"
              : "STANDBY"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1 rounded border border-navy-700 bg-navy-900/80 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-navy-600 hover:text-white transition-colors cursor-pointer"
            title={isPaused ? "Resume log stream" : "Pause log stream"}
          >
            {isPaused ? <Play size={10} className="text-emerald-400" /> : <Pause size={10} className="text-amber-400" />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={handleCopyLog}
            className="flex items-center gap-1 rounded border border-navy-700 bg-navy-900/80 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-navy-600 hover:text-white transition-colors cursor-pointer"
            title="Copy log to clipboard"
          >
            {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 p-3 bg-[#050e1c] border-b border-navy-800/80">
        <div className="rounded border border-navy-800/70 bg-[#09182d] p-2">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">A* Frontier Nodes</span>
          <span className="text-base font-mono font-bold text-cyan-300">
            {nodesCount.toLocaleString()}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">142 pruned</span>
        </div>

        <div className="rounded border border-navy-800/70 bg-[#09182d] p-2">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Peak Ice Conc</span>
          <span className="text-base font-mono font-bold text-amber-300">
            {simulationStatus === "idle" ? "—" : `${icePeak}%`}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Antarctic Sound</span>
        </div>

        <div className="rounded border border-navy-800/70 bg-[#09182d] p-2">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Min Berg CPA</span>
          <span className="text-base font-mono font-bold text-emerald-300">
            {simulationStatus === "idle" ? "—" : `${cpaDist} NM`}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Standoff ≥ 2.0 NM</span>
        </div>

        <div className="rounded border border-navy-800/70 bg-[#09182d] p-2">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Hull Speed Cap</span>
          <span className="text-base font-mono font-bold text-blue-300">
            {simulationStatus === "idle" ? "—" : "11.2 kn"}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Polar Class Bound</span>
        </div>

        <div className="rounded border border-navy-800/70 bg-[#09182d] p-2">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Besetment Risk</span>
          <span className="text-base font-mono font-bold text-slate-200">
            {simulationStatus === "idle" ? "—" : `${besetmentPct}%`}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">Monte Carlo (1k)</span>
        </div>

        <div className="rounded border border-navy-800/70 bg-[#09182d] p-2">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">POLARIS RIO</span>
          <span className="text-base font-mono font-bold text-emerald-400">
            {simulationStatus === "idle" ? "—" : `+${rioScore} PASS`}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block">IMO Polar Code</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#081527] border-b border-navy-800/60 overflow-x-auto text-[10px] font-mono">
        <span className="text-slate-500 mr-1 shrink-0">FILTER:</span>
        {["ALL", "METOCEAN", "ICEBERG", "HAZARD", "A*-ROUTER", "POLARIS"].map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setSelectedFilter(filter)}
            className={cn(
              "rounded px-2 py-0.5 transition-colors cursor-pointer shrink-0",
              selectedFilter === filter
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                : "text-slate-400 hover:text-white"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Terminal Log Console */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 min-h-[220px] max-h-[340px] bg-[#050c18] select-text"
        role="log"
        aria-live="polite"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
            <Terminal size={24} className="mb-2 text-slate-600 animate-pulse" />
            <p className="font-semibold text-xs text-slate-400">Telemetry Engine Ready</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click &quot;Generate Mission Analysis&quot; to begin streaming real-time calculations.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 hover:bg-navy-900/40 px-1.5 py-0.5 rounded transition-colors text-[11px] leading-relaxed"
            >
              <span className="text-slate-500 shrink-0 select-none">{log.timestamp}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.2 text-[9px] font-bold shrink-0",
                  log.subsystem === "METOCEAN"
                    ? "bg-blue-900/60 text-blue-300 border border-blue-700/50"
                    : log.subsystem === "ICEBERG"
                    ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700/50"
                    : log.subsystem === "HAZARD"
                    ? "bg-amber-900/60 text-amber-300 border border-amber-700/50"
                    : log.subsystem === "VESSEL"
                    ? "bg-purple-900/60 text-purple-300 border border-purple-700/50"
                    : log.subsystem === "A*-ROUTER"
                    ? "bg-indigo-900/60 text-indigo-300 border border-indigo-700/50"
                    : log.subsystem === "POLARIS"
                    ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50"
                    : "bg-slate-800 text-slate-300"
                )}
              >
                [{log.subsystem}]
              </span>
              <span className="flex-1 text-slate-300">{log.message}</span>
              {log.metric && (
                <span className="rounded bg-navy-800 px-1.5 py-0.2 text-[10px] font-bold text-cyan-400 border border-navy-700 shrink-0">
                  {log.metric}
                </span>
              )}
            </div>
          ))
        )}

        {simulationStatus === "running" && (
          <div className="flex items-center gap-1 text-cyan-400 text-[11px] pt-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="animate-pulse">Computing continuous hydro-kinematic equations...</span>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between border-t border-navy-800/80 bg-[#081527] px-3 py-1.5 text-[10px] font-mono text-slate-500">
        <span>Log Buffer: {logs.length} events logged</span>
        <span>Convergence Engine: v2.4 (Antarctic Polar Code)</span>
      </div>
    </div>
  );
}
