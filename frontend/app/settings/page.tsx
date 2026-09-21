"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import {
  Sliders,
  Bell,
  Compass,
  Cpu,
  Database,
  RotateCcw,
  Check,
  Save,
  Download,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Gauge,
  Layers,
  MapPin,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  RefreshCw,
  Eye,
} from "lucide-react";

type SettingsTab = "simulation" | "alerts" | "navigation" | "cartography" | "system";

type UnitSystem = "nautical" | "metric";
type CoordFormat = "dms" | "decimal" | "mgrs";
type RiskTolerance = "conservative" | "standard" | "aggressive";
type SimSpeed = "1x" | "2x" | "5x" | "10x";
type MonteCarloSamples = 100 | 500 | 1000;
type MapTheme = "vector" | "sar" | "satellite";

interface SettingsState {
  // Navigation & Units
  unitSystem: UnitSystem;
  coordFormat: CoordFormat;
  riskTolerance: RiskTolerance;
  soundingsDepth: number;
  magneticDeclination: "auto" | "true" | "manual";

  // Simulation Engine
  simSpeed: SimSpeed;
  monteCarloSamples: MonteCarloSamples;
  autoStartSimulation: boolean;
  iceDriftModel: "dynamic" | "static";
  convergenceThreshold: number; // e.g. 0.05

  // Alerts & Notifications
  audioAlerts: boolean;
  besetmentAlertScore: number;
  icebergBufferNm: number;
  mandatoryMitigationEnforce: boolean;
  satelliteReportIntervalMins: number;

  // Cartography
  mapTheme: MapTheme;
  radarAnimation: boolean;
  mapAutoCenter: boolean;
  mapLayers: {
    ice: boolean;
    icebergs: boolean;
    hazards: boolean;
    routes: boolean;
    bathymetry: boolean;
    windVectors: boolean;
  };

  // Profile
  activeProfile: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  unitSystem: "nautical",
  coordFormat: "dms",
  riskTolerance: "standard",
  soundingsDepth: 50,
  magneticDeclination: "auto",

  simSpeed: "2x",
  monteCarloSamples: 500,
  autoStartSimulation: false,
  iceDriftModel: "dynamic",
  convergenceThreshold: 0.05,

  audioAlerts: true,
  besetmentAlertScore: 65,
  icebergBufferNm: 5.0,
  mandatoryMitigationEnforce: true,
  satelliteReportIntervalMins: 30,

  mapTheme: "vector",
  radarAnimation: true,
  mapAutoCenter: true,
  mapLayers: {
    ice: true,
    icebergs: true,
    hazards: true,
    routes: true,
    bathymetry: true,
    windVectors: false,
  },

  activeProfile: "Antarctic Expeditionary Standard",
};

const RISK_LEVELS: { value: RiskTolerance; label: string; threshold: string; desc: string }[] = [
  {
    value: "conservative",
    label: "Conservative Safety",
    threshold: "30/100",
    desc: "Re-routes at moderate risk. Maximum standoff from pack ice edges and pressure ridges.",
  },
  {
    value: "standard",
    label: "Standard IMO Balanced",
    threshold: "50/100",
    desc: "Standard operational risk threshold. Optimizes trade-off between fuel, safety, and transit duration.",
  },
  {
    value: "aggressive",
    label: "Extended Operational",
    threshold: "70/100",
    desc: "Permits transit through dense floes. Authorized exclusively for PC2-PC4 certified icebreakers.",
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>("simulation");
  const [savedToast, setSavedToast] = useState(false);
  const [resetToast, setResetToast] = useState(false);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fordberg_navigation_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Fallback in-memory
    }
  }, []);

  const saveSettings = (newSettings: SettingsState) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("fordberg_navigation_settings", JSON.stringify(newSettings));
    } catch {
      // Ignore in-memory fallback
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleReset = () => {
    saveSettings(DEFAULT_SETTINGS);
    setResetToast(true);
    setTimeout(() => setResetToast(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fordberg_settings_profile_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        saveSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (err) {
        alert("Failed to parse settings JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "simulation", label: "Simulation & Engine", icon: Cpu },
    { id: "alerts", label: "Alerts & Polar Safety", icon: Bell },
    { id: "navigation", label: "Units & Positioning", icon: Compass },
    { id: "cartography", label: "Tactical Cartography", icon: Layers },
    { id: "system", label: "Profiles & Diagnostics", icon: Database },
  ];

  return (
    <AppShell>
      {/* Header with Title and Global Action Buttons */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-navy-900">Control System Configuration</h1>
            <span className="rounded bg-navy-100 px-2.5 py-0.5 text-[10px] font-mono font-bold text-navy-800">
              v2.4 DSS KERNEL
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Polar navigation parameters, simulation fidelity, safety triggers &amp; telemetry preferences
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedToast && (
            <div className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 animate-fade-in">
              <Check size={14} />
              <span>Preferences Saved</span>
            </div>
          )}
          {resetToast && (
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 animate-fade-in">
              <RefreshCw size={14} className="animate-spin" />
              <span>Defaults Restored</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:border-border-strong hover:bg-surface2 transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="mb-6 flex overflow-x-auto border-b border-border gap-2 pb-px scrollbar-none">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                active
                  ? "border-blue-600 text-blue-600 bg-blue-50/40"
                  : "border-transparent text-text-muted hover:text-navy-900 hover:border-border-strong"
              )}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* 1. SIMULATION & ENGINE */}
        {activeTab === "simulation" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Simulation Speed */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-navy-900">Simulation Playback Velocity</h2>
                <Gauge size={16} className="text-blue-600" />
              </div>
              <p className="mb-4 text-xs text-text-muted">Controls speed of animated route corridor analysis</p>
              <div className="grid grid-cols-4 gap-2">
                {(["1x", "2x", "5x", "10x"] as SimSpeed[]).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => saveSettings({ ...settings, simSpeed: spd })}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border py-2.5 text-center transition-all cursor-pointer",
                      settings.simSpeed === spd
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 font-bold text-blue-700"
                        : "border-border hover:border-border-strong hover:bg-surface2 text-text-secondary"
                    )}
                  >
                    <span className="text-sm">{spd}</span>
                    <span className="text-[10px] text-text-subtle">
                      {spd === "1x" ? "Realtime" : spd === "10x" ? "Sprint" : "Rapid"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Monte Carlo Engine Samples */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-navy-900">Monte Carlo Simulation Ensemble</h2>
                <Cpu size={16} className="text-blue-600" />
              </div>
              <p className="mb-4 text-xs text-text-muted">
                Stochastic perturbation runs across weather, ice drift, and speed curves
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([100, 500, 1000] as MonteCarloSamples[]).map((samples) => (
                  <button
                    key={samples}
                    type="button"
                    onClick={() => saveSettings({ ...settings, monteCarloSamples: samples })}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border py-2.5 text-center transition-all cursor-pointer",
                      settings.monteCarloSamples === samples
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 font-bold text-blue-700"
                        : "border-border hover:border-border-strong hover:bg-surface2 text-text-secondary"
                    )}
                  >
                    <span className="font-mono text-sm font-semibold">{samples} runs</span>
                    <span className="text-[10px] text-text-subtle">
                      {samples === 100 ? "Fast Preview" : samples === 500 ? "Balanced (IMO)" : "Full Research"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ice Drift Model */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-navy-900">Ice Dynamics Kinematic Model</h2>
              <p className="mb-4 text-xs text-text-muted">Methodology for projecting floe movement along corridor</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "dynamic",
                    title: "Dynamic Wind + Tide",
                    desc: "Simulates 6-hourly vector drift based on ECMWF wind fields and tidal oscillation.",
                  },
                  {
                    id: "static",
                    title: "Static Observation",
                    desc: "Maintains last known satellite SAR ice perimeter without drift extrapolation.",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => saveSettings({ ...settings, iceDriftModel: item.id as "dynamic" | "static" })}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3 text-left transition-all cursor-pointer",
                      settings.iceDriftModel === item.id
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-border hover:border-border-strong hover:bg-surface2"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-900">{item.title}</span>
                      {settings.iceDriftModel === item.id && <Check size={14} className="text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Start Simulation */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-navy-900">Automated Pipeline Execution</h2>
                  <Sparkles size={16} className="text-blue-600" />
                </div>
                <p className="text-xs text-text-muted">
                  Automatically trigger the 8-stage simulation pipeline when selecting new vessel or mission corridor
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface2/60 p-3">
                <div>
                  <p className="text-xs font-bold text-navy-900">Auto-Run Simulation</p>
                  <p className="text-[11px] text-text-subtle">Saves manual click on &quot;Run Simulation&quot;</p>
                </div>
                <button
                  type="button"
                  onClick={() => saveSettings({ ...settings, autoStartSimulation: !settings.autoStartSimulation })}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                    settings.autoStartSimulation ? "bg-blue-600" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-xs",
                      settings.autoStartSimulation ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. ALERTS & POLAR SAFETY */}
        {activeTab === "alerts" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Audio & Visual Chimes */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-navy-900">Audio Hazard Alerts</h2>
                {settings.audioAlerts ? (
                  <Volume2 size={16} className="text-blue-600" />
                ) : (
                  <VolumeX size={16} className="text-text-subtle" />
                )}
              </div>
              <p className="mb-4 text-xs text-text-muted">
                Auditory alarms on approaching critical ice thresholds or high-risk zones
              </p>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-xs font-bold text-navy-900">Bridge Audio Chime</p>
                  <p className="text-[11px] text-text-muted">Plays synthetic sonar pulse on severe risk breach</p>
                </div>
                <button
                  type="button"
                  onClick={() => saveSettings({ ...settings, audioAlerts: !settings.audioAlerts })}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                    settings.audioAlerts ? "bg-blue-600" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-xs",
                      settings.audioAlerts ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Besetment Warning Threshold */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-navy-900">Besetment Alarm Sensitivity</h2>
                <AlertTriangle size={16} className="text-risk-high" />
              </div>
              <p className="mb-3 text-xs text-text-muted">Score threshold that elevates besetment status to CRITICAL</p>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-muted">Threshold Trigger</span>
                <span className="font-mono text-sm font-bold text-navy-900">{settings.besetmentAlertScore}/100</span>
              </div>
              <input
                type="range"
                min={40}
                max={85}
                step={5}
                value={settings.besetmentAlertScore}
                onChange={(e) => saveSettings({ ...settings, besetmentAlertScore: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[10px] text-text-subtle font-mono">
                <span>40 (Sensitive)</span>
                <span>65 (IMO Standard)</span>
                <span>85 (Tolerant)</span>
              </div>
            </div>

            {/* Iceberg Proximity Buffer */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-navy-900">Iceberg Standoff Perimeter</h2>
                <ShieldCheck size={16} className="text-risk-low" />
              </div>
              <p className="mb-3 text-xs text-text-muted">
                Minimum safe separation radius maintained by automated pathfinder
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[2.5, 5.0, 8.0].map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => saveSettings({ ...settings, icebergBufferNm: dist })}
                    className={cn(
                      "rounded-lg border py-2.5 text-center transition-all cursor-pointer",
                      settings.icebergBufferNm === dist
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 text-blue-700 font-bold"
                        : "border-border hover:border-border-strong hover:bg-surface2 text-text-secondary"
                    )}
                  >
                    <span className="font-mono text-sm">{dist.toFixed(1)} NM</span>
                    <p className="text-[10px] text-text-subtle">
                      {dist === 2.5 ? "Tight Channel" : dist === 5.0 ? "Recommended" : "Heavy Swell"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Mitigation Lockout */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="mb-1 text-sm font-semibold text-navy-900">Mandatory Safeguard Enforcement</h2>
                <p className="text-xs text-text-muted">
                  Require officer acknowledgment of all mandatory mitigations prior to voyage clearance
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface2/60 p-3">
                <div>
                  <p className="text-xs font-bold text-navy-900">Departure Safety Lock</p>
                  <p className="text-[11px] text-text-subtle">IMO ISM Code compliant validation</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    saveSettings({
                      ...settings,
                      mandatoryMitigationEnforce: !settings.mandatoryMitigationEnforce,
                    })
                  }
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                    settings.mandatoryMitigationEnforce ? "bg-blue-600" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-xs",
                      settings.mandatoryMitigationEnforce ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. UNITS & POSITIONING */}
        {activeTab === "navigation" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Unit System */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-navy-900">Measurement Unit Standards</h2>
              <p className="mb-4 text-xs text-text-muted">Distances, speeds, fuel burn, and bathymetry</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "nautical", title: "Nautical Standard", units: "NM · knots · MT · meters" },
                  { id: "metric", title: "Metric System", units: "km · km/h · tonnes · meters" },
                ].map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => saveSettings({ ...settings, unitSystem: u.id as UnitSystem })}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3.5 text-left transition-all cursor-pointer",
                      settings.unitSystem === u.id
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-border hover:border-border-strong hover:bg-surface2"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-navy-900">{u.title}</span>
                      {settings.unitSystem === u.id && <Check size={14} className="text-blue-600" />}
                    </div>
                    <span className="font-mono text-[10px] text-text-muted">{u.units}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinate Format */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-navy-900">Geodetic Coordinate Representation</h2>
              <p className="mb-4 text-xs text-text-muted">Waypoints and GPS position display convention</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dms", label: "DMS", eg: "64°15.2′S 58°30.0′W" },
                  { id: "decimal", label: "Decimal", eg: "-64.253°, -58.500°" },
                  { id: "mgrs", label: "Polar Grid", eg: "UPS South 21D" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => saveSettings({ ...settings, coordFormat: f.id as CoordFormat })}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3 text-left transition-all cursor-pointer",
                      settings.coordFormat === f.id
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-border hover:border-border-strong hover:bg-surface2"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-900">{f.label}</span>
                      {settings.coordFormat === f.id && <Check size={12} className="text-blue-600" />}
                    </div>
                    <span className="font-mono text-[9px] text-text-subtle truncate">{f.eg}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Tolerance Thresholds */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-1 text-sm font-semibold text-navy-900">Polar Risk Margin Profile</h2>
              <p className="mb-4 text-xs text-text-muted">
                Governs algorithmic re-routing sensitivity across baseline corridors
              </p>
              <div className="grid gap-2.5 md:grid-cols-3">
                {RISK_LEVELS.map(({ value, label, threshold, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => saveSettings({ ...settings, riskTolerance: value })}
                    className={cn(
                      "flex flex-col justify-between rounded-lg border p-4 text-left transition-all cursor-pointer",
                      settings.riskTolerance === value
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-border hover:border-border-strong hover:bg-surface2"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-navy-900">{label}</span>
                        {settings.riskTolerance === value && <Check size={14} className="text-blue-600" />}
                      </div>
                      <span className="mt-1 inline-block rounded border border-border bg-surface2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-text-muted">
                        Cutoff: {threshold}
                      </span>
                      <p className="mt-2 text-xs text-text-muted leading-relaxed">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. TACTICAL CARTOGRAPHY */}
        {activeTab === "cartography" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Map Theme */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-navy-900">Hydrographic Map Engine</h2>
              <p className="mb-4 text-xs text-text-muted">Visual rendering style for polar sea sector</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "vector", label: "Vector Chart", desc: "High-contrast bathymetry" },
                  { id: "sar", label: "Synthetic Aperture", desc: "Radar backscatter map" },
                  { id: "satellite", label: "True Color MODIS", desc: "Optical cloud & floes" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => saveSettings({ ...settings, mapTheme: t.id as MapTheme })}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3 text-left transition-all cursor-pointer",
                      settings.mapTheme === t.id
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-border hover:border-border-strong hover:bg-surface2"
                    )}
                  >
                    <span className="text-xs font-bold text-navy-900">{t.label}</span>
                    <span className="text-[10px] text-text-subtle">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Radar Animation Pulse */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="mb-1 text-sm font-semibold text-navy-900">Radar Beacon Animation</h2>
                <p className="text-xs text-text-muted">
                  Smooth rotating sonar sweep and pulse animations on active waypoints and vessel marker
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface2/60 p-3">
                <div>
                  <p className="text-xs font-bold text-navy-900">Pulse Animations</p>
                  <p className="text-[11px] text-text-subtle">Disable to conserve GPU and battery</p>
                </div>
                <button
                  type="button"
                  onClick={() => saveSettings({ ...settings, radarAnimation: !settings.radarAnimation })}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors cursor-pointer",
                    settings.radarAnimation ? "bg-blue-600" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-xs",
                      settings.radarAnimation ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Map Layer Defaults */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-1 text-sm font-semibold text-navy-900">Default Tactical GIS Layers</h2>
              <p className="mb-4 text-xs text-text-muted">Select layers enabled automatically upon chart initialization</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: "ice", label: "Ice Concentration Grids", desc: "AMSR2 / Sentinel-1 data" },
                  { key: "icebergs", label: "Tracked Tabular Bergs", desc: "NIC Antarctic tracking" },
                  { key: "hazards", label: "Spatial Hazard Polygons", desc: "Shoals & pressure ridges" },
                  { key: "routes", label: "Corridor Waypoint Paths", desc: "Active & baseline options" },
                  { key: "bathymetry", label: "Sounding Contours", desc: "GEBCO 2024 bathymetry" },
                  { key: "windVectors", label: "ECMWF Wind Quivers", desc: "Surface atmospheric vectors" },
                ].map((layer) => {
                  const active = settings.mapLayers[layer.key as keyof typeof settings.mapLayers];
                  return (
                    <button
                      key={layer.key}
                      type="button"
                      onClick={() =>
                        saveSettings({
                          ...settings,
                          mapLayers: {
                            ...settings.mapLayers,
                            [layer.key]: !active,
                          },
                        })
                      }
                      className={cn(
                        "flex items-start justify-between rounded-lg border p-3 text-left transition-all cursor-pointer",
                        active
                          ? "border-blue-600 bg-blue-50/70"
                          : "border-border bg-surface2/50 text-text-muted"
                      )}
                    >
                      <div>
                        <p className="text-xs font-bold text-navy-900">{layer.label}</p>
                        <p className="text-[10px] text-text-subtle">{layer.desc}</p>
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors",
                          active ? "bg-blue-600 border-blue-600 text-white" : "border-border bg-surface"
                        )}
                      >
                        {active && <Check size={11} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. PROFILES & DIAGNOSTICS */}
        {activeTab === "system" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Mission Profile Management */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-navy-900">Active Operational Profile</h2>
              <p className="mb-4 text-xs text-text-muted">Preset configuration packages for specific mission categories</p>
              <div className="space-y-2">
                {[
                  "Antarctic Expeditionary Standard",
                  "Scientific Ice-Margin Survey",
                  "Deep Weddell Fast-Ice Penetration",
                  "Commercial High-Latitude Supply",
                ].map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => saveSettings({ ...settings, activeProfile: profile })}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer",
                      settings.activeProfile === profile
                        ? "border-blue-600 bg-blue-50 text-navy-900 ring-1 ring-blue-600"
                        : "border-border hover:border-border-strong hover:bg-surface2 text-text-secondary"
                    )}
                  >
                    <span>{profile}</span>
                    {settings.activeProfile === profile && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Export & Import Profile */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="mb-1 text-sm font-semibold text-navy-900">Profile Backup &amp; Synchronization</h2>
                <p className="text-xs text-text-muted">
                  Export or restore mission profiles for fleet-wide distribution via JSON
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-navy-900 hover:border-border-strong hover:bg-surface2 transition-all cursor-pointer shadow-xs"
                >
                  <Download size={13} className="text-blue-600" />
                  <span>Export Profile JSON</span>
                </button>

                <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-navy-900 hover:border-border-strong hover:bg-surface2 transition-all cursor-pointer shadow-xs">
                  <Upload size={13} className="text-blue-600" />
                  <span>Import JSON Profile</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-lg bg-surface2 border border-border/80 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-navy-900">
                  <Radio size={13} className="text-blue-600" />
                  <span>DSS Telemetry Heartbeat</span>
                </div>
                <p className="mt-1 text-[11px] text-text-muted">
                  Satellite uplink: Active · Cache status: 4.8 MB local memory · Synced with IMO Polar DSS standard.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
