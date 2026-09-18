"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { cn, riskBadge, riskBar, riskLabel, coordToSvg } from "@/lib/utils";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Search,
  Filter,
  MapPin,
  Layers,
  Radar,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Info,
  Compass,
  Radio,
  Clock,
  Eye,
  Activity,
  AlertCircle,
} from "lucide-react";

interface HazardZone {
  id: string;
  name: string;
  type: string;
  category: "ridge" | "shoal" | "multiyear" | "fastice" | "drift" | "lead";
  riskScore: number;
  severity: "Critical" | "High" | "Moderate" | "Low";
  lat: number;
  lon: number;
  radiusNm: number;
  factors: { label: string; score: number }[];
  recommendation: string;
  iceThicknessM: number;
  concentrationTenths: number;
  driftVelocityKn: number;
  iceClassLimitations: {
    openWater: "Prohibited" | "Restricted" | "Escort Only" | "Permitted";
    pc4: "Prohibited" | "Restricted" | "Escort Only" | "Permitted";
    pc2: "Prohibited" | "Restricted" | "Escort Only" | "Permitted";
  };
  observationSource: string;
  lastUpdated: string;
}

const HAZARD_ZONES: HazardZone[] = [
  {
    id: "H1",
    name: "Antarctic Sound Pressure Ridge",
    type: "Pressure Ridge",
    category: "ridge",
    riskScore: 78,
    severity: "High",
    lat: -63.35,
    lon: -56.85,
    radiusNm: 18,
    factors: [
      { label: "Ice pressure & buckling", score: 85 },
      { label: "Drift convergence dynamics", score: 72 },
      { label: "Vessel compressive exposure", score: 68 },
    ],
    recommendation: "Avoid during spring tidal ice movement. Icebreaker escort recommended for PC4+ hull class.",
    iceThicknessM: 2.8,
    concentrationTenths: 9,
    driftVelocityKn: 1.4,
    iceClassLimitations: {
      openWater: "Prohibited",
      pc4: "Escort Only",
      pc2: "Permitted",
    },
    observationSource: "Sentinel-1 SAR interferometry",
    lastUpdated: "42 min ago",
  },
  {
    id: "H2",
    name: "Joinville Bank Grounding Shallows",
    type: "Grounding / Shoal",
    category: "shoal",
    riskScore: 58,
    severity: "Moderate",
    lat: -63.15,
    lon: -55.6,
    radiusNm: 24,
    factors: [
      { label: "Under-keel depth clearance", score: 65 },
      { label: "Bathymetric survey currency", score: 50 },
      { label: "Iceberg drift grounding overlay", score: 55 },
    ],
    recommendation: "Reduce speed and maintain continuous echo sounder watch. Do not transit in reduced visibility.",
    iceThicknessM: 1.2,
    concentrationTenths: 4,
    driftVelocityKn: 0.8,
    iceClassLimitations: {
      openWater: "Restricted",
      pc4: "Permitted",
      pc2: "Permitted",
    },
    observationSource: "GEBCO 2024 / Airborne Lidar",
    lastUpdated: "2 hrs ago",
  },
  {
    id: "H3",
    name: "Weddell Multi-Year Ice Pack",
    type: "Multi-Year Ice",
    category: "multiyear",
    riskScore: 82,
    severity: "High",
    lat: -65.25,
    lon: -58.1,
    radiusNm: 32,
    factors: [
      { label: "Old ice floe thickness & hardness", score: 90 },
      { label: "Icefield compaction index", score: 80 },
      { label: "Besetment & entrapment probability", score: 75 },
    ],
    recommendation: "Mandatory speed throttle × 0.75. Daylight transit only. Minimum polar ice class PC4 required.",
    iceThicknessM: 3.6,
    concentrationTenths: 9,
    driftVelocityKn: 0.5,
    iceClassLimitations: {
      openWater: "Prohibited",
      pc4: "Restricted",
      pc2: "Permitted",
    },
    observationSource: "AMSR2 Passive Microwave Sensor",
    lastUpdated: "1.5 hrs ago",
  },
  {
    id: "H4",
    name: "Larsen Fast Ice Barrier",
    type: "Fast Ice",
    category: "fastice",
    riskScore: 95,
    severity: "Critical",
    lat: -65.8,
    lon: -61.25,
    radiusNm: 28,
    factors: [
      { label: "Fast-ice solidity & landfast lock", score: 98 },
      { label: "Shelf calving & break-up hazard", score: 88 },
      { label: "Total corridor route blockage", score: 95 },
    ],
    recommendation: "RESTRICTED — Icebreaker escort mandatory. Transit speed ≤ 2.5 kn or vessel structural ice limit.",
    iceThicknessM: 4.8,
    concentrationTenths: 10,
    driftVelocityKn: 0.1,
    iceClassLimitations: {
      openWater: "Prohibited",
      pc4: "Escort Only",
      pc2: "Restricted",
    },
    observationSource: "RADARSAT Constellation Mission",
    lastUpdated: "18 min ago",
  },
  {
    id: "H5",
    name: "Erebus Drift Field",
    type: "Drift Ice Field",
    category: "drift",
    riskScore: 52,
    severity: "Moderate",
    lat: -64.15,
    lon: -59.4,
    radiusNm: 20,
    factors: [
      { label: "Pancake & brash floe density", score: 60 },
      { label: "Surface current drift speed", score: 45 },
      { label: "Atmospheric fog & sea smoke", score: 55 },
    ],
    recommendation: "Post dedicated forward ice watch. Reduce speed to ice transit limit. Continuously track radar targets.",
    iceThicknessM: 0.9,
    concentrationTenths: 6,
    driftVelocityKn: 2.1,
    iceClassLimitations: {
      openWater: "Restricted",
      pc4: "Permitted",
      pc2: "Permitted",
    },
    observationSource: "MODIS Terra True-Color Composite",
    lastUpdated: "3 hrs ago",
  },
  {
    id: "H6",
    name: "Bransfield Open-Lead Fairway",
    type: "Open Water Lead",
    category: "lead",
    riskScore: 20,
    severity: "Low",
    lat: -62.75,
    lon: -60.45,
    radiusNm: 40,
    factors: [
      { label: "Residual growler/bergy bit presence", score: 18 },
      { label: "Southern Ocean swell exposure", score: 22 },
      { label: "Channel navigational clearance", score: 20 },
    ],
    recommendation: "Preferred tactical transit corridor. Monitor thermal leads for freeze-up. Normal operational cruise speed.",
    iceThicknessM: 0.2,
    concentrationTenths: 2,
    driftVelocityKn: 1.0,
    iceClassLimitations: {
      openWater: "Permitted",
      pc4: "Permitted",
      pc2: "Permitted",
    },
    observationSource: "Copernicus Sentinel-3 OLCI",
    lastUpdated: "55 min ago",
  },
];

const SEVERITY_COLORS: Record<string, { badge: string; border: string; bg: string; text: string; pin: string }> = {
  Critical: {
    badge: "border-risk-high/40 bg-risk-high-bg text-risk-high",
    border: "border-risk-high/50",
    bg: "bg-risk-high/10",
    text: "text-risk-high",
    pin: "#c0392b",
  },
  High: {
    badge: "border-risk-high/30 bg-risk-high-bg text-risk-high",
    border: "border-risk-high/40",
    bg: "bg-risk-high/5",
    text: "text-risk-high",
    pin: "#d9534f",
  },
  Moderate: {
    badge: "border-risk-med/30 bg-risk-med-bg text-risk-med",
    border: "border-risk-med/40",
    bg: "bg-risk-med/5",
    text: "text-risk-med",
    pin: "#d4910a",
  },
  Low: {
    badge: "border-risk-low/30 bg-risk-low-bg text-risk-low",
    border: "border-risk-low/40",
    bg: "bg-risk-low/5",
    text: "text-risk-low",
    pin: "#1e8449",
  },
};

export default function HazardsPage() {
  const [selectedId, setSelectedId] = useState<string>("H4"); // Default to critical hazard
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"risk-desc" | "risk-asc" | "name">("risk-desc");
  const [viewMode, setViewMode] = useState<"radar-split" | "cards-only">("radar-split");

  const selected = useMemo(
    () => HAZARD_ZONES.find((h) => h.id === selectedId) ?? HAZARD_ZONES[0],
    [selectedId]
  );

  // Filtered and sorted hazard zones
  const filteredZones = useMemo(() => {
    let result = [...HAZARD_ZONES];

    // Severity filter
    if (severityFilter !== "all") {
      result = result.filter((h) => h.severity === severityFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((h) => h.category === categoryFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.type.toLowerCase().includes(q) ||
          h.id.toLowerCase().includes(q) ||
          h.recommendation.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "risk-desc") {
      result.sort((a, b) => b.riskScore - a.riskScore);
    } else if (sortBy === "risk-asc") {
      result.sort((a, b) => a.riskScore - b.riskScore);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [severityFilter, categoryFilter, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const criticalCount = HAZARD_ZONES.filter((h) => h.severity === "Critical").length;
    const highCount = HAZARD_ZONES.filter((h) => h.severity === "High").length;
    const moderateCount = HAZARD_ZONES.filter((h) => h.severity === "Moderate").length;
    const lowCount = HAZARD_ZONES.filter((h) => h.severity === "Low").length;
    const avgScore = Math.round(
      HAZARD_ZONES.reduce((acc, h) => acc + h.riskScore, 0) / HAZARD_ZONES.length
    );
    return { criticalCount, highCount, moderateCount, lowCount, avgScore };
  }, []);

  return (
    <AppShell>
      {/* Top Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-navy-900">Antarctic Hazard Intelligence</h1>
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700">
              <Radio size={10} className="animate-pulse text-blue-600" />
              SATELLITE SAR SYNC
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Spatial hazard zones · Ice morphology &amp; compressive stress telemetry · IMO Polar Code restrictions
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 shadow-xs">
            <div className="flex items-center gap-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-risk-high" />
              <span className="font-bold text-navy-900">{stats.criticalCount}</span>
              <span className="text-[10px] text-text-muted">Crit</span>
            </div>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-risk-high" />
              <span className="font-bold text-navy-900">{stats.highCount}</span>
              <span className="text-[10px] text-text-muted">High</span>
            </div>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-risk-med" />
              <span className="font-bold text-navy-900">{stats.moderateCount}</span>
              <span className="text-[10px] text-text-muted">Mod</span>
            </div>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-risk-low" />
              <span className="font-bold text-navy-900">{stats.lowCount}</span>
              <span className="text-[10px] text-text-muted">Low</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 shadow-xs font-mono text-xs">
            <span className="text-text-muted">Sector Avg: </span>
            <span className="font-bold text-navy-900">{stats.avgScore}/100</span>
          </div>
        </div>
      </div>

      {/* Critical Alert Warning Banner */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-risk-high/40 bg-risk-high-bg/80 p-4 text-risk-high shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-risk-high/15 p-2 text-risk-high shrink-0">
            <Siren size={20} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider">CRITICAL HAZARD WARNING</span>
              <span className="rounded bg-risk-high text-white px-1.5 py-0.2 text-[9px] font-mono font-bold">
                ZONE H4 ACTIVE
              </span>
            </div>
            <p className="mt-0.5 text-xs text-navy-900 font-medium">
              <strong>Larsen Fast Ice Barrier:</strong> Route blockage with landfast ice pack exceeding 4.8m thickness.
              Mandatory icebreaker escort in effect.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedId("H4")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-risk-high px-3 py-1.5 text-xs font-semibold text-white hover:bg-risk-high/90 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <span>Inspect Zone H4</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search hazard zones, types, coordinates, or advisories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface2 py-1.5 pl-9 pr-3 text-xs text-navy-900 placeholder:text-text-subtle focus:border-blue-600 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted hover:text-navy-900"
              >
                Clear
              </button>
            )}
          </div>

          {/* Severity quick filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-text-muted mr-1">Severity:</span>
            {["all", "Critical", "High", "Moderate", "Low"].map((sev) => {
              const active = severityFilter === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    active
                      ? "bg-navy-900 text-white shadow-xs"
                      : "border border-border bg-surface2 text-text-secondary hover:border-border-strong hover:bg-surface"
                  )}
                >
                  {sev === "all" ? "All Severities" : sev}
                </button>
              );
            })}
          </div>

          {/* Sort & View mode toggles */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface2 px-2.5 py-1 text-xs">
              <ArrowUpDown size={12} className="text-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-navy-900 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="risk-desc">Highest Risk First</option>
                <option value="risk-asc">Lowest Risk First</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface2 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("radar-split")}
                className={cn(
                  "p-1.5 rounded transition-colors cursor-pointer",
                  viewMode === "radar-split" ? "bg-surface text-navy-900 shadow-xs" : "text-text-muted hover:text-navy-900"
                )}
                title="Tactical Map & List View"
              >
                <Radar size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards-only")}
                className={cn(
                  "p-1.5 rounded transition-colors cursor-pointer",
                  viewMode === "cards-only" ? "bg-surface text-navy-900 shadow-xs" : "text-text-muted hover:text-navy-900"
                )}
                title="Grid Cards Only"
              >
                <Layers size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left/Middle: Tactical Map & Hazard Cards List */}
        <div className={cn("space-y-6", viewMode === "radar-split" ? "xl:col-span-8" : "xl:col-span-8")}>
          {/* Spatial Sector Radar Map */}
          {viewMode === "radar-split" && (
            <div className="relative overflow-hidden rounded-xl border border-border bg-[#0a1120] p-4 text-white shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radar size={15} className="text-blue-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                    Tactical Antarctic Sector Hazard Plot (62.0°S – 66.5°S)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-blue-300">EPSG:3031 Polar Stereographic Projection</span>
              </div>

              {/* Native Vector Map Canvas */}
              <div className="relative aspect-[16/9] w-full rounded-lg border border-blue-900/50 bg-[#070d18] overflow-hidden">
                <svg viewBox="0 0 1000 650" className="h-full w-full select-none">
                  {/* Graticule lines */}
                  <defs>
                    <radialGradient id="radarSweepGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Lat / Lon grid lines */}
                  {[0, 162, 325, 487, 650].map((y) => (
                    <line
                      key={y}
                      x1={0}
                      y1={y}
                      x2={1000}
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                  ))}
                  {[0, 200, 400, 600, 800, 1000].map((x) => (
                    <line
                      key={x}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={650}
                      stroke="#1e293b"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                  ))}

                  {/* Antarctic coastline stylized backdrop */}
                  <path
                    d="M 120 40 Q 250 180 340 280 T 480 480 T 600 620 L 0 650 L 0 0 Z"
                    fill="#111c2e"
                    stroke="#1e3a8a"
                    strokeWidth={1.5}
                    opacity={0.6}
                  />

                  {/* Hazard Zone Circles & Interactive Hotspots */}
                  {HAZARD_ZONES.map((hz) => {
                    const pos = coordToSvg(hz.lat, hz.lon, 1000, 650);
                    const isSelected = selectedId === hz.id;
                    const sev = SEVERITY_COLORS[hz.severity] ?? SEVERITY_COLORS.Moderate;
                    const r = Math.max(25, hz.radiusNm * 1.8);

                    return (
                      <g
                        key={hz.id}
                        onClick={() => setSelectedId(hz.id)}
                        className="cursor-pointer transition-all"
                      >
                        {/* Area footprint circle */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={r}
                          fill={sev.pin}
                          fillOpacity={isSelected ? 0.35 : 0.18}
                          stroke={sev.pin}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray={hz.severity === "Critical" ? "6,3" : undefined}
                          className="transition-all duration-200"
                        />

                        {/* Pulsing ring for critical/high */}
                        {(hz.severity === "Critical" || hz.severity === "High") && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={r * 1.25}
                            fill="none"
                            stroke={sev.pin}
                            strokeWidth={1}
                            opacity={0.4}
                            className="animate-ping"
                          />
                        )}

                        {/* Center Beacon */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isSelected ? 7 : 5}
                          fill={sev.pin}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />

                        {/* Label Badge */}
                        <g transform={`translate(${pos.x + 10}, ${pos.y - 10})`}>
                          <rect
                            x={0}
                            y={-14}
                            width={54}
                            height={18}
                            rx={4}
                            fill="#0f172a"
                            fillOpacity={0.85}
                            stroke={isSelected ? "#60a5fa" : "#334155"}
                            strokeWidth={1}
                          />
                          <text
                            x={6}
                            y={-2}
                            fontSize={10}
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#ffffff"
                          >
                            {hz.id} · {hz.riskScore}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {/* Map Floating Legend */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-3 rounded-lg border border-blue-900/60 bg-navy-950/80 px-3 py-1.5 text-[10px] backdrop-blur-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Critical/High Zone</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Moderate Shoal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Open Lead Corridor</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtered Hazard Zone Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Identified Spatial Hazards ({filteredZones.length})
              </h2>
              <span className="text-xs text-text-subtle">Click a card to inspect operational guidelines</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {filteredZones.map((hz) => {
                const isSelected = selectedId === hz.id;
                const sev = SEVERITY_COLORS[hz.severity] ?? SEVERITY_COLORS.Moderate;

                return (
                  <div
                    key={hz.id}
                    onClick={() => setSelectedId(hz.id)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-xl border bg-surface p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/15"
                        : "border-border hover:border-border-strong"
                    )}
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-navy-900 bg-surface2 px-1.5 py-0.5 rounded border border-border">
                            {hz.id}
                          </span>
                          <span className={cn("rounded border px-2 py-0.5 text-[10px] font-bold uppercase", sev.badge)}>
                            {hz.severity}
                          </span>
                          <span className="text-[10px] text-text-muted font-medium">{hz.type}</span>
                        </div>

                        <span
                          className={cn(
                            "shrink-0 rounded border px-2 py-0.5 font-mono text-xs font-bold shadow-xs",
                            riskBadge(hz.riskScore)
                          )}
                        >
                          Score {hz.riskScore}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="mt-2 text-sm font-bold text-navy-900 group-hover:text-blue-700 transition-colors">
                        {hz.name}
                      </h3>

                      {/* Quick Meta: Coordinates and Observation */}
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-text-muted font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-text-subtle" />
                          {Math.abs(hz.lat).toFixed(2)}°S, {Math.abs(hz.lon).toFixed(2)}°W
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-text-subtle" />
                          {hz.lastUpdated}
                        </span>
                      </div>

                      {/* Risk bar */}
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", riskBar(hz.riskScore))}
                            style={{ width: `${hz.riskScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Recommendation snippet */}
                      <p className="mt-2.5 text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {hz.recommendation}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-[11px]">
                      <span className="font-medium text-text-muted">
                        Ice Thickness: <strong className="text-navy-900 font-mono">{hz.iceThicknessM}m</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect Profile</span>
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Comprehensive Zone Inspector Panel */}
        <div className="xl:col-span-4 space-y-4">
          <div className="sticky top-6 rounded-xl border border-border bg-surface p-5 shadow-sm space-y-5">
            {/* Inspector Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Zone Intelligence Dossier
                </span>
                <span className="rounded-full bg-surface2 px-2 py-0.5 font-mono text-[10px] font-bold text-navy-900 border border-border">
                  {selected.id}
                </span>
              </div>
              <h2 className="mt-1 text-base font-bold text-navy-900 leading-snug">{selected.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[10px] font-bold uppercase",
                    SEVERITY_COLORS[selected.severity]?.badge
                  )}
                >
                  {selected.severity} Severity
                </span>
                <span className="text-xs text-text-muted font-medium">{selected.type}</span>
              </div>
            </div>

            {/* Overall Score Dial / Bar */}
            <div className="rounded-lg border border-border bg-surface2 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-navy-900">Composite Risk Index</span>
                <span className="font-mono text-base font-extrabold text-navy-900">
                  {selected.riskScore}<span className="text-xs font-normal text-text-muted">/100</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", riskBar(selected.riskScore))}
                  style={{ width: `${selected.riskScore}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-text-subtle text-right">
                Classification: {riskLabel(selected.riskScore)}
              </p>
            </div>

            {/* Physical & Satellite Observations */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2.5">
                Physical Ice Parameters
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border bg-surface p-2">
                  <p className="text-[10px] text-text-muted">Thickness</p>
                  <p className="font-mono text-sm font-bold text-navy-900 mt-0.5">{selected.iceThicknessM} m</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2">
                  <p className="text-[10px] text-text-muted">Concentration</p>
                  <p className="font-mono text-sm font-bold text-navy-900 mt-0.5">
                    {selected.concentrationTenths}/10
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2">
                  <p className="text-[10px] text-text-muted">Drift Rate</p>
                  <p className="font-mono text-sm font-bold text-navy-900 mt-0.5">
                    {selected.driftVelocityKn} kn
                  </p>
                </div>
              </div>
            </div>

            {/* Factor Decomposition */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                Factor Decomposition Breakdown
              </h3>
              <div className="space-y-2.5">
                {selected.factors.map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary font-medium">{f.label}</span>
                      <span className="font-mono font-bold text-navy-900">{f.score}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", riskBar(f.score))}
                        style={{ width: `${f.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vessel Ice Class Operational Compliance */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                IMO Polar Code Vessel Access
              </h3>
              <div className="space-y-1.5 text-xs">
                {[
                  { classId: "OpenWater", label: "OpenWater Hulls", status: selected.iceClassLimitations.openWater },
                  { classId: "PC4", label: "Polar Class 4 (Attenborough)", status: selected.iceClassLimitations.pc4 },
                  { classId: "PC2", label: "Polar Class 2 (Charcot)", status: selected.iceClassLimitations.pc2 },
                ].map((row) => {
                  const isProhibited = row.status === "Prohibited";
                  const isEscort = row.status === "Escort Only";
                  const isRestricted = row.status === "Restricted";

                  return (
                    <div
                      key={row.classId}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface2 px-3 py-2"
                    >
                      <span className="font-medium text-navy-900 text-[11px]">{row.label}</span>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-bold",
                          isProhibited
                            ? "bg-risk-high text-white"
                            : isEscort
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : isRestricted
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        )}
                      >
                        {row.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tactical Operational Recommendation */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-navy-900">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
                <ShieldCheck size={14} className="text-blue-700" />
                <span>Tactical Recommendation &amp; SOP</span>
              </div>
              <p className="text-xs text-navy-900 leading-relaxed">{selected.recommendation}</p>
            </div>

            {/* Telemetry Sensor Source */}
            <div className="border-t border-border/80 pt-3 text-[10px] text-text-subtle flex items-center justify-between">
              <span>Source: {selected.observationSource}</span>
              <span className="font-mono">Updated {selected.lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
