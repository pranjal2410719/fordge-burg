"use client";

import { useState } from "react";
import { coordToSvg } from "@/lib/utils";
import type { RouteId } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { SimulationStatus } from "@/components/session/MissionContext";
import { Compass, Radar, Layers, Eye, Route as RouteIcon, ShieldAlert } from "lucide-react";

const ROUTE_PATHS: Record<RouteId, [number, number][]> = {
  shortest: [
    [-62.2, -58.95],
    [-63.1, -57.8],
    [-63.5, -57.5],
    [-65.5, -56.0],
  ],
  safest: [
    [-62.2, -58.95],
    [-62.8, -60.2],
    [-63.0, -61.0],
    [-64.5, -59.5],
    [-65.5, -56.0],
  ],
  fuel_efficient: [
    [-62.2, -58.95],
    [-63.5, -58.2],
    [-64.2, -57.0],
    [-65.5, -56.0],
  ],
  balanced: [
    [-62.2, -58.95],
    [-63.0, -58.7],
    [-63.4, -58.5],
    [-64.2, -57.5],
    [-64.6, -57.0],
    [-65.5, -56.0],
  ],
};

const ROUTE_COLORS: Record<RouteId, string> = {
  shortest: "#c0392b",
  safest: "#1e8449",
  fuel_efficient: "#d4910a",
  balanced: "#1e6fd9",
};

const ROUTE_LABELS: Record<RouteId, string> = {
  shortest: "Shortest (412 NM)",
  safest: "Safest (528 NM)",
  fuel_efficient: "Fuel-Eff. (458 NM)",
  balanced: "Balanced (445 NM)",
};

// 4 Tabular Icebergs with positions and drift directions
const ICEBERGS = [
  { id: "B1", lat: -63.2, lon: -59.8, driftDx: 28, driftDy: 14, speedKn: 0.8 },
  { id: "B2", lat: -63.8, lon: -58.4, driftDx: -20, driftDy: 25, speedKn: 1.2 },
  { id: "B3", lat: -64.0, lon: -60.0, driftDx: 15, driftDy: 30, speedKn: 0.6 },
  { id: "B4", lat: -62.8, lon: -58.0, driftDx: -18, driftDy: 18, speedKn: 0.9 },
];

// Hazard zones
const HAZARD_ZONES: { pts: [number, number][]; color: string; label: string; stroke: string }[] = [
  {
    pts: [
      [-63.5, -61.0],
      [-63.5, -60.0],
      [-64.0, -60.0],
      [-64.0, -61.0],
    ],
    color: "rgba(192, 57, 43, 0.18)",
    stroke: "#c0392b",
    label: "Pressure Ridge Zone PR-01",
  },
  {
    pts: [
      [-64.0, -58.5],
      [-64.0, -57.5],
      [-64.5, -57.5],
      [-64.5, -58.5],
    ],
    color: "rgba(212, 145, 10, 0.18)",
    stroke: "#d4910a",
    label: "Multi-Year Ice Floe MYI-02",
  },
];

// A* Frontier Search Lattice Probes for animation
const FRONTIER_PROBES: [number, number][] = [
  [-62.5, -59.2],
  [-62.7, -58.6],
  [-62.9, -59.7],
  [-63.2, -58.9],
  [-63.3, -60.5],
  [-63.6, -59.1],
  [-63.7, -57.8],
  [-64.1, -59.2],
  [-64.3, -58.1],
  [-64.7, -58.8],
  [-65.0, -57.4],
  [-65.2, -56.8],
];

interface SimulationPreviewMapProps {
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  simulationStatus: SimulationStatus;
  simulationProgress: number;
}

export function SimulationPreviewMap({
  selectedRouteId,
  onSelectRoute,
  simulationStatus,
  simulationProgress,
}: SimulationPreviewMapProps) {
  const origin = coordToSvg(-62.2, -58.95);
  const dest = coordToSvg(-65.5, -56.0);

  // Layer toggles
  const [showRadar, setShowRadar] = useState(true);
  const [showBergs, setShowBergs] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showFrontier, setShowFrontier] = useState(true);
  const [hoverCoord, setHoverCoord] = useState<{ lat: string; lon: string } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 1000;
    const svgY = ((e.clientY - rect.top) / rect.height) * 650;

    // Invert coordToSvg projection
    // x = ((lon + 64) / 10) * 1000 => lon = (x / 100) - 64
    // y = ((-62 - lat) / 4.5) * 650 => lat = -62 - (y * 4.5 / 650)
    const lon = (svgX / 100) - 64;
    const lat = -62 - (svgY * 4.5) / 650;

    setHoverCoord({
      lat: `${Math.abs(lat).toFixed(2)}°S`,
      lon: `${Math.abs(lon).toFixed(2)}°W`,
    });
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface shadow-sm overflow-hidden h-full">
      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Compass size={14} className="text-blue-600" />
          <span className="text-xs font-bold text-navy-900">
            Antarctic Polar Simulation Preview
          </span>
          {simulationStatus === "running" && (
            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
              RADAR ACTIVE
            </span>
          )}
        </div>

        {/* Layer toggle buttons */}
        <div className="flex items-center gap-1 flex-wrap text-[10px]">
          <button
            type="button"
            onClick={() => setShowRadar(!showRadar)}
            className={cn(
              "rounded px-2 py-1 font-semibold border transition-colors cursor-pointer",
              showRadar ? "border-blue-300 bg-blue-50 text-blue-700" : "border-border text-text-muted"
            )}
          >
            Radar Pulse
          </button>
          <button
            type="button"
            onClick={() => setShowBergs(!showBergs)}
            className={cn(
              "rounded px-2 py-1 font-semibold border transition-colors cursor-pointer",
              showBergs ? "border-blue-300 bg-blue-50 text-blue-700" : "border-border text-text-muted"
            )}
          >
            Bergs & CPA
          </button>
          <button
            type="button"
            onClick={() => setShowHazards(!showHazards)}
            className={cn(
              "rounded px-2 py-1 font-semibold border transition-colors cursor-pointer",
              showHazards ? "border-blue-300 bg-blue-50 text-blue-700" : "border-border text-text-muted"
            )}
          >
            Hazard Zones
          </button>
          <button
            type="button"
            onClick={() => setShowFrontier(!showFrontier)}
            className={cn(
              "rounded px-2 py-1 font-semibold border transition-colors cursor-pointer",
              showFrontier ? "border-blue-300 bg-blue-50 text-blue-700" : "border-border text-text-muted"
            )}
          >
            A* Lattice
          </button>
        </div>
      </div>

      {/* Route selector bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 text-xs overflow-x-auto">
        <span className="text-[11px] font-semibold text-text-muted mr-2 shrink-0">Trajectories:</span>
        <div className="flex items-center gap-2">
          {(Object.keys(ROUTE_COLORS) as RouteId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectRoute(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all cursor-pointer shrink-0",
                selectedRouteId === id
                  ? "border-navy-900 bg-navy-900 text-white shadow-xs"
                  : "border-border bg-surface text-text-muted hover:border-border-strong hover:bg-surface2"
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: ROUTE_COLORS[id] }}
              />
              {ROUTE_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative flex-1 bg-gradient-to-br from-[#bad6f0] via-[#9ec5e8] to-[#80add7] min-h-[360px]">
        <svg
          viewBox="0 0 1000 650"
          className="h-full w-full select-none"
          role="img"
          aria-label="Antarctic polar simulation preview map"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverCoord(null)}
        >
          <defs>
            {/* Pressure Ridge diagonal hatch pattern */}
            <pattern
              id="hazard-pattern-ridge"
              width="10"
              height="10"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="10" stroke="#c0392b" strokeWidth="2" strokeOpacity="0.4" />
            </pattern>
            {/* Multi-Year Ice diagonal hatch */}
            <pattern
              id="hazard-pattern-myi"
              width="10"
              height="10"
              patternTransform="rotate(-45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="10" stroke="#d4910a" strokeWidth="2" strokeOpacity="0.4" />
            </pattern>

            {/* Radar gradient beam */}
            <radialGradient id="radar-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e6fd9" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#2e86f5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#5aa3f7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Graticule lines */}
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <line
              key={`v${f}`}
              x1={f * 1000}
              y1={0}
              x2={f * 1000}
              y2={650}
              stroke="#83a3bd"
              strokeWidth={0.8}
              strokeDasharray="4 6"
            />
          ))}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={`h${f}`}
              x1={0}
              y1={f * 650}
              x2={1000}
              y2={f * 650}
              stroke="#83a3bd"
              strokeWidth={0.8}
              strokeDasharray="4 6"
            />
          ))}

          {/* Ice Shelf Zone boundary */}
          <rect x={0} y={470} width={1000} height={180} fill="rgba(235, 245, 255, 0.65)" />
          <line x1={0} y1={470} x2={1000} y2={470} stroke="#7aa5c4" strokeWidth={1.5} strokeDasharray="8 5" />
          <text x={16} y={490} fontSize={11} fill="#3f7296" fontFamily="monospace" fontWeight="bold">
            Larsen Ice Shelf Margin
          </text>

          {/* Hazard Zones */}
          {showHazards &&
            HAZARD_ZONES.map((hz, idx) => {
              const svgPts = hz.pts.map(([la, lo]) => coordToSvg(la, lo));
              const d =
                svgPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
                " Z";
              const center = svgPts.reduce(
                (acc, p) => ({ x: acc.x + p.x / svgPts.length, y: acc.y + p.y / svgPts.length }),
                { x: 0, y: 0 }
              );
              return (
                <g key={`hazard-${idx}`}>
                  <path d={d} fill={hz.color} stroke={hz.stroke} strokeWidth={1.5} strokeDasharray="5 3" />
                  <rect
                    x={svgPts[0].x}
                    y={svgPts[0].y}
                    width={Math.abs(svgPts[1].x - svgPts[0].x)}
                    height={Math.abs(svgPts[2].y - svgPts[1].y)}
                    fill={idx === 0 ? "url(#hazard-pattern-ridge)" : "url(#hazard-pattern-myi)"}
                  />
                  <rect
                    x={center.x - 70}
                    y={center.y - 10}
                    width={140}
                    height={18}
                    rx={3}
                    fill="rgba(255,255,255,0.85)"
                    stroke={hz.stroke}
                    strokeWidth={0.7}
                  />
                  <text
                    x={center.x}
                    y={center.y + 3}
                    fontSize={9}
                    textAnchor="middle"
                    fill={hz.stroke}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {hz.label}
                  </text>
                </g>
              );
            })}

          {/* A* Frontier Search Lattice Probes */}
          {showFrontier &&
            FRONTIER_PROBES.map(([la, lo], i) => {
              const p = coordToSvg(la, lo);
              const isActiveInRun =
                simulationStatus === "running" &&
                (i / FRONTIER_PROBES.length) * 100 <= simulationProgress;

              return (
                <g key={`probe-${i}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActiveInRun ? 5 : 3}
                    fill={isActiveInRun ? "#1e6fd9" : "#ffffff"}
                    fillOpacity={isActiveInRun ? 0.9 : 0.45}
                    stroke="#234070"
                    strokeWidth={0.8}
                  />
                  {isActiveInRun && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={10}
                      fill="none"
                      stroke="#2e86f5"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      opacity={0.7}
                    />
                  )}
                </g>
              );
            })}

          {/* Iceberg Markers & CPA Vectors */}
          {showBergs &&
            ICEBERGS.map((b) => {
              const p = coordToSvg(b.lat, b.lon);
              return (
                <g key={b.id}>
                  {/* Standoff 2.0 NM exclusion perimeter */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={32}
                    fill="none"
                    stroke="#c0392b"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />

                  {/* Drift velocity vector arrow */}
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={p.x + b.driftDx}
                    y2={p.y + b.driftDy}
                    stroke="#1a2e58"
                    strokeWidth={1.8}
                  />
                  <circle
                    cx={p.x + b.driftDx}
                    cy={p.y + b.driftDy}
                    r={2.5}
                    fill="#1a2e58"
                  />

                  {/* Iceberg Polygon */}
                  <polygon
                    points={`${p.x},${p.y - 9} ${p.x - 7},${p.y + 5} ${p.x + 7},${p.y + 5}`}
                    fill="#ffffff"
                    stroke="#46789e"
                    strokeWidth={1.5}
                    filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.2))"
                  />
                  <rect
                    x={p.x - 14}
                    y={p.y + 8}
                    width={28}
                    height={13}
                    rx={2}
                    fill="rgba(10,25,48,0.85)"
                  />
                  <text
                    x={p.x}
                    y={p.y + 17}
                    fontSize={8}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {b.id}·{b.speedKn}k
                  </text>
                </g>
              );
            })}

          {/* Non-selected route alternatives (faint dashed) */}
          {(Object.keys(ROUTE_PATHS) as RouteId[])
            .filter((id) => id !== selectedRouteId)
            .map((id) => {
              const pts = ROUTE_PATHS[id].map(([la, lo]) => coordToSvg(la, lo));
              const d = pts
                .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                .join(" ");
              return (
                <path
                  key={`route-${id}`}
                  d={d}
                  fill="none"
                  stroke={ROUTE_COLORS[id]}
                  strokeWidth={2}
                  strokeOpacity={0.4}
                  strokeDasharray="6 4"
                  className="cursor-pointer hover:stroke-width-3 transition-all"
                  onClick={() => onSelectRoute(id)}
                />
              );
            })}

          {/* Selected Route Trajectory (bold highlighted with animation) */}
          {selectedRouteId && (() => {
            const pts = ROUTE_PATHS[selectedRouteId].map(([la, lo]) => coordToSvg(la, lo));
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(" ");

            return (
              <g key={`selected-${selectedRouteId}`}>
                {/* Glow backdrop */}
                <path
                  d={d}
                  fill="none"
                  stroke={ROUTE_COLORS[selectedRouteId]}
                  strokeWidth={12}
                  strokeOpacity={0.2}
                />
                {/* Main trajectory path */}
                <path
                  d={d}
                  fill="none"
                  stroke={ROUTE_COLORS[selectedRouteId]}
                  strokeWidth={3.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={
                    simulationStatus === "running"
                      ? {
                          strokeDasharray: "8 4",
                          animation: "spin 12s linear infinite",
                        }
                      : undefined
                  }
                />
                {/* Intermediate waypoint dots */}
                {pts.slice(1, -1).map((p, i) => (
                  <g key={`wpt-${i}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      fill={ROUTE_COLORS[selectedRouteId]}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    <text
                      x={p.x + 8}
                      y={p.y + 3}
                      fontSize={9}
                      fill="#0a1930"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      WP{i + 1}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}

          {/* Dynamic Radar Scan Pulse during simulation */}
          {showRadar && simulationStatus === "running" && (
            <g>
              {/* Expanding concentric radar wave rings */}
              <circle
                cx={origin.x}
                cy={origin.y}
                r={60 + (simulationProgress * 2.8)}
                fill="none"
                stroke="#1e6fd9"
                strokeWidth={2}
                strokeOpacity={Math.max(0, 1 - simulationProgress / 100)}
              />
              <circle
                cx={origin.x}
                cy={origin.y}
                r={120 + (simulationProgress * 2.2)}
                fill="none"
                stroke="#2e86f5"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeOpacity={Math.max(0, 0.8 - simulationProgress / 100)}
              />
              {/* Radar beam sector sweep */}
              <circle
                cx={origin.x}
                cy={origin.y}
                r={180}
                fill="url(#radar-pulse)"
              />
            </g>
          )}

          {/* Origin Marker (Maxwell Bay) */}
          <g transform={`translate(${origin.x}, ${origin.y})`}>
            <circle cx={0} cy={0} r={12} fill="#0a1930" opacity={0.9} />
            <circle cx={0} cy={0} r={6} fill="#ffffff" />
            <circle cx={0} cy={0} r={2} fill="#0a1930" />
            <rect x={16} y={-10} width={82} height={20} rx={3} fill="rgba(10,25,48,0.85)" />
            <text x={22} y={4} fontSize={10} fontWeight="bold" fill="#ffffff" fontFamily="monospace">
              ORIGIN: MB
            </text>
          </g>

          {/* Destination Marker (Weddell Outpost) */}
          <g transform={`translate(${dest.x}, ${dest.y})`}>
            <circle cx={0} cy={0} r={12} fill="#c0392b" opacity={0.9} />
            <circle cx={0} cy={0} r={6} fill="#ffffff" />
            <circle cx={0} cy={0} r={2} fill="#c0392b" />
            <rect x={16} y={-10} width={90} height={20} rx={3} fill="rgba(192,57,43,0.9)" />
            <text x={22} y={4} fontSize={10} fontWeight="bold" fill="#ffffff" fontFamily="monospace">
              DEST: ALPHA
            </text>
          </g>

          {/* Scale bar */}
          <g transform="translate(830, 610)">
            <line x1={0} y1={0} x2={100} y2={0} stroke="#234070" strokeWidth={2.5} />
            <line x1={0} y1={-5} x2={0} y2={5} stroke="#234070" strokeWidth={2.5} />
            <line x1={100} y1={-5} x2={100} y2={5} stroke="#234070" strokeWidth={2.5} />
            <text x={50} y={-8} fontSize={10} textAnchor="middle" fill="#122040" fontFamily="monospace" fontWeight="bold">
              ~50 NM
            </text>
          </g>

          {/* Coordinates grid labels */}
          <text x={10} y={18} fontSize={9} fill="#3f7296" fontFamily="monospace" fontWeight="bold">62.0°S</text>
          <text x={10} y={640} fontSize={9} fill="#3f7296" fontFamily="monospace" fontWeight="bold">66.5°S</text>
          <text x={10} y={325} fontSize={9} fill="#3f7296" fontFamily="monospace" fontWeight="bold">64.0°W</text>
          <text x={870} y={325} fontSize={9} fill="#3f7296" fontFamily="monospace" fontWeight="bold">54.0°W</text>
        </svg>

        {/* Hover Coordinate Overlay */}
        {hoverCoord && (
          <div className="absolute top-2 left-2 rounded bg-navy-950/85 px-2 py-1 font-mono text-[10px] text-cyan-300 border border-navy-800 shadow-md">
            LAT: {hoverCoord.lat} · LON: {hoverCoord.lon}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-border bg-surface px-4 py-2 text-[10px] text-text-subtle font-mono">
        <span>Equirectangular Sector: 62.0°S–66.5°S · 54.0°W–64.0°W</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-navy-900 font-semibold">
            <span className="h-2 w-2 rounded-full bg-navy-900" /> Origin
          </span>
          <span className="flex items-center gap-1 text-risk-high font-semibold">
            <span className="h-2 w-2 rounded-full bg-risk-high" /> Destination
          </span>
          <span className="flex items-center gap-1 text-text-secondary font-semibold">
            <span className="h-2 w-2 rounded-full bg-blue-600" /> Selected Route
          </span>
        </div>
      </div>
    </div>
  );
}
