"use client";

import { coordToSvg } from "@/lib/utils";
import type { RouteId } from "@/lib/data";
import { cn } from "@/lib/utils";

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
  shortest:      "#c0392b",
  safest:        "#1e8449",
  fuel_efficient:"#d4910a",
  balanced:      "#1e6fd9",
};

const ROUTE_LABELS: Record<RouteId, string> = {
  shortest:      "Shortest",
  safest:        "Safest",
  fuel_efficient:"Fuel-Eff.",
  balanced:      "Balanced",
};

// Fake iceberg positions for visual richness
const ICEBERGS: [number, number][] = [
  [-63.2, -59.8],
  [-63.8, -58.4],
  [-64.0, -60.0],
  [-62.8, -58.0],
];

// Hazard zone polygons (simplified rectangles via 4 corners)
const HAZARD_ZONES: { pts: [number, number][]; color: string; label: string }[] = [
  {
    pts: [[-63.5,-61.0],[-63.5,-60.0],[-64.0,-60.0],[-64.0,-61.0]],
    color: "rgba(192,57,43,0.15)",
    label: "Pressure Ridge",
  },
  {
    pts: [[-64.0,-58.5],[-64.0,-57.5],[-64.5,-57.5],[-64.5,-58.5]],
    color: "rgba(212,145,10,0.15)",
    label: "Multi-Yr Ice",
  },
];

export function SimpleMap({
  selectedRouteId,
  onSelectRoute,
}: {
  selectedRouteId?: RouteId;
  onSelectRoute?: (id: RouteId) => void;
}) {
  const origin = coordToSvg(-62.2, -58.95);
  const dest   = coordToSvg(-65.5, -56.0);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
      {/* Legend bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-xs font-semibold text-text-muted">Antarctic Sector Map</span>
        <div className="flex items-center gap-3">
          {(Object.keys(ROUTE_COLORS) as RouteId[]).map((id) => (
            <button
              key={id}
              className={cn(
                "flex items-center gap-1.5 text-[10px] transition-opacity",
                selectedRouteId && selectedRouteId !== id ? "opacity-40" : "opacity-100"
              )}
              onClick={() => onSelectRoute?.(id)}
            >
              <span className="h-2 w-5 rounded-sm" style={{ background: ROUTE_COLORS[id] }} />
              {ROUTE_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG map */}
      <svg
        viewBox="0 0 1000 650"
        className="h-auto w-full"
        style={{ background: "linear-gradient(160deg,#c8dff5 0%,#a8c8e8 100%)" }}
        role="img"
        aria-label="Antarctic map showing route alternatives and hazard zones"
      >
        {/* Graticule */}
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line key={`v${f}`} x1={f * 1000} y1={0} x2={f * 1000} y2={650} stroke="#9ab5cc" strokeWidth={0.8} strokeDasharray="4 6" />
        ))}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={`h${f}`} x1={0} y1={f * 650} x2={1000} y2={f * 650} stroke="#9ab5cc" strokeWidth={0.8} strokeDasharray="4 6" />
        ))}

        {/* Ice shelf area (light blue overlay bottom) */}
        <rect x={0} y={460} width={1000} height={190} fill="rgba(220,238,255,0.55)" />
        <line x1={0} y1={460} x2={1000} y2={460} stroke="#a8c8e8" strokeWidth={1} strokeDasharray="8 4" />
        <text x={12} y={480} fontSize={11} fill="#5b8aac" fontFamily="monospace">Ice Shelf Zone</text>

        {/* Hazard zones */}
        {HAZARD_ZONES.map((hz, idx) => {
          const svgPts = hz.pts.map(([la, lo]) => coordToSvg(la, lo));
          const d = svgPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
          const center = svgPts.reduce((a, b) => ({ x: a.x + b.x / svgPts.length, y: a.y + b.y / svgPts.length }), { x: 0, y: 0 });
          return (
            <g key={idx}>
              <path d={d} fill={hz.color} stroke="rgba(150,100,50,0.3)" strokeWidth={1} strokeDasharray="3 3" />
              <text x={center.x} y={center.y} fontSize={9} textAnchor="middle" fill="rgba(120,80,40,0.7)" fontFamily="monospace">{hz.label}</text>
            </g>
          );
        })}

        {/* Non-selected routes (faint) */}
        {(Object.keys(ROUTE_PATHS) as RouteId[]).filter(id => id !== selectedRouteId).map((id) => {
          const pts = ROUTE_PATHS[id].map(([la, lo]) => coordToSvg(la, lo));
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          return (
            <path
              key={id}
              d={d}
              fill="none"
              stroke={ROUTE_COLORS[id]}
              strokeWidth={1.5}
              strokeOpacity={0.35}
              strokeDasharray="6 4"
              className={cn(onSelectRoute && "cursor-pointer")}
              onClick={() => onSelectRoute?.(id)}
            />
          );
        })}

        {/* Selected route (bold) */}
        {selectedRouteId && (() => {
          const pts = ROUTE_PATHS[selectedRouteId].map(([la, lo]) => coordToSvg(la, lo));
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          return (
            <g key={selectedRouteId}>
              {/* Glow */}
              <path d={d} fill="none" stroke={ROUTE_COLORS[selectedRouteId]} strokeWidth={10} strokeOpacity={0.12} />
              {/* Line */}
              <path d={d} fill="none" stroke={ROUTE_COLORS[selectedRouteId]} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
              {/* Waypoint dots */}
              {pts.slice(1, -1).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill={ROUTE_COLORS[selectedRouteId]} fillOpacity={0.7} />
              ))}
            </g>
          );
        })()}

        {/* Iceberg markers */}
        {ICEBERGS.map(([la, lo], i) => {
          const p = coordToSvg(la, lo);
          return (
            <g key={i}>
              <polygon
                points={`${p.x},${p.y - 9} ${p.x - 7},${p.y + 5} ${p.x + 7},${p.y + 5}`}
                fill="rgba(255,255,255,0.9)"
                stroke="#7aafc8"
                strokeWidth={1.2}
              />
              <text x={p.x} y={p.y + 18} fontSize={8} textAnchor="middle" fill="#5b8aac" fontFamily="monospace">
                B{i + 1}
              </text>
            </g>
          );
        })}

        {/* Origin marker */}
        <circle cx={origin.x} cy={origin.y} r={10} fill="#0a1930" opacity={0.9} />
        <circle cx={origin.x} cy={origin.y} r={5}  fill="white" />
        <text x={origin.x + 15} y={origin.y + 4} fontSize={13} fontWeight="bold" fill="#0a1930" fontFamily="monospace">Origin</text>

        {/* Destination marker */}
        <circle cx={dest.x} cy={dest.y} r={10} fill="#c0392b" opacity={0.9} />
        <circle cx={dest.x} cy={dest.y} r={5}  fill="white" />
        <text x={dest.x + 15} y={dest.y + 4} fontSize={13} fontWeight="bold" fill="#c0392b" fontFamily="monospace">Destination</text>

        {/* Scale bar */}
        <g transform="translate(820,610)">
          <line x1={0} y1={0} x2={100} y2={0} stroke="#5b6b7f" strokeWidth={2} />
          <line x1={0} y1={-5} x2={0} y2={5} stroke="#5b6b7f" strokeWidth={2} />
          <line x1={100} y1={-5} x2={100} y2={5} stroke="#5b6b7f" strokeWidth={2} />
          <text x={50} y={-8} fontSize={10} textAnchor="middle" fill="#5b6b7f" fontFamily="monospace">~50 NM</text>
        </g>

        {/* Grid labels */}
        <text x={8} y={16} fontSize={9} fill="#5b8aac" fontFamily="monospace">62.0°S</text>
        <text x={8} y={640} fontSize={9} fill="#5b8aac" fontFamily="monospace">66.5°S</text>
        <text x={8} y={330} fontSize={9} fill="#5b8aac" fontFamily="monospace">64.0°W</text>
        <text x={870} y={330} fontSize={9} fill="#5b8aac" fontFamily="monospace">54.0°W</text>
      </svg>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span className="font-mono text-[10px] text-text-subtle">
          Equirectangular · 62.0°S–66.5°S · 54.0°W–64.0°W · 1000×650
        </span>
        <div className="flex items-center gap-3 text-[10px] text-text-subtle">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-navy-900" /> Origin
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#c0392b]" /> Destination
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block" style={{ fontSize:8 }}>▲</span> Iceberg
          </span>
        </div>
      </div>
    </div>
  );
}
