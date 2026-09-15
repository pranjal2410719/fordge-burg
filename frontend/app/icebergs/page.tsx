"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SimpleMap } from "@/components/map/SimpleMap";
import { useMission } from "@/components/session/MissionContext";
import { cn, riskBadge } from "@/lib/utils";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import { useState } from "react";

interface Iceberg {
  id: string;
  name: string;
  type: string;
  lat: string;
  lon: string;
  lengthKm: number;
  widthKm: number;
  driftHeading: number;
  driftKn: number;
  uncertaintyNm: number;
  cpaNm: number;
  riskScore: number;
}

const ICEBERGS: Iceberg[] = [
  { id: "A68A", name: "A-68A Giant Fragment",     type: "Tabular",    lat: "63°12.4'S", lon: "56°24.8'W", lengthKm: 18.5, widthKm: 8.2,  driftHeading: 45, driftKn: 0.4, uncertaintyNm: 2.1, cpaNm: 4.2, riskScore: 72 },
  { id: "A74",  name: "A-74 Tabular Berg",         type: "Tabular",    lat: "64°05.1'S", lon: "58°11.7'W", lengthKm: 9.3,  widthKm: 4.6,  driftHeading: 32, driftKn: 0.3, uncertaintyNm: 1.8, cpaNm: 6.8, riskScore: 45 },
  { id: "B30",  name: "B-30 Wedge",               type: "Wedge",      lat: "62°48.6'S", lon: "57°53.2'W", lengthKm: 5.2,  widthKm: 2.1,  driftHeading: 60, driftKn: 0.6, uncertaintyNm: 1.2, cpaNm: 7.1, riskScore: 38 },
  { id: "C28",  name: "C-28 Pinnacled",            type: "Pinnacled",  lat: "63°31.8'S", lon: "59°42.0'W", lengthKm: 3.7,  widthKm: 1.8,  driftHeading: 15, driftKn: 0.5, uncertaintyNm: 0.9, cpaNm: 9.3, riskScore: 28 },
  { id: "D15",  name: "D-15 Tabular",              type: "Tabular",    lat: "64°20.3'S", lon: "55°18.4'W", lengthKm: 7.8,  widthKm: 3.4,  driftHeading: 52, driftKn: 0.3, uncertaintyNm: 1.5, cpaNm: 11.2,riskScore: 22 },
  { id: "E09",  name: "E-09 Dome",                 type: "Domed",      lat: "63°02.7'S", lon: "60°37.5'W", lengthKm: 2.4,  widthKm: 1.9,  driftHeading: 25, driftKn: 0.7, uncertaintyNm: 0.6, cpaNm: 14.5,riskScore: 18 },
  { id: "GW07", name: "GW-07 Growler Field",       type: "Growler",    lat: "63°45.2'S", lon: "57°01.3'W", lengthKm: 0.1,  widthKm: 0.05, driftHeading: 70, driftKn: 0.8, uncertaintyNm: 0.3, cpaNm: 3.1, riskScore: 65 },
  { id: "GW08", name: "GW-08 Bergy Bit",           type: "Bergy Bit",  lat: "63°58.9'S", lon: "58°50.6'W", lengthKm: 0.08, widthKm: 0.04, driftHeading: 55, driftKn: 0.6, uncertaintyNm: 0.2, cpaNm: 5.0, riskScore: 52 },
];

export default function IcebergsPage() {
  const { selectedRouteId, setSelectedRouteId } = useMission();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = ICEBERGS.find((b) => b.id === selectedId);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Iceberg Intelligence</h1>
        <p className="mt-0.5 text-sm text-text-muted">8 tracked targets · CPA analysis · 5.0 NM mandatory standoff</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Iceberg table */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-navy-900">Target Catalog</h2>
            <p className="text-xs text-text-muted mt-0.5">Click a row to inspect</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface2 text-left">
                  {["ID", "Name & Type", "Size (km)", "Drift", "CPA", "Risk"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ICEBERGS.map((b) => (
                  <tr
                    key={b.id}
                    className={cn(
                      "border-b border-border cursor-pointer transition-colors",
                      selectedId === b.id ? "bg-blue-50" : "hover:bg-surface2"
                    )}
                    onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-navy-900">{b.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-navy-900">{b.name}</p>
                      <p className="text-[10px] text-text-muted">{b.type}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {b.lengthKm.toFixed(1)} × {b.widthKm.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {String(b.driftHeading).padStart(3, "0")}° / {b.driftKn} kn
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={cn(
                        "rounded border px-1.5 py-0.5 text-[11px] font-semibold",
                        b.cpaNm < 5 ? "border-risk-high/30 bg-risk-high-bg text-risk-high" :
                        b.cpaNm < 8 ? "border-risk-med/30 bg-risk-med-bg text-risk-med" :
                        "border-risk-low/30 bg-risk-low-bg text-risk-low"
                      )}>
                        {b.cpaNm.toFixed(1)} NM
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold", riskBadge(b.riskScore))}>
                        {b.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspection HUD */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {selected ? (
            <div className="animate-fade-in">
              <div className="border-b border-border bg-surface2 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-navy-900">Berg Detail — {selected.id}</h2>
                  <button onClick={() => setSelectedId(null)} aria-label="Close detail" className="rounded p-1 text-text-subtle hover:bg-border/60 hover:text-navy-900">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-bold text-navy-900">{selected.name}</p>
                  <p className="text-xs text-text-muted">{selected.type}</p>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-xs">
                  {[
                    ["Latitude",  selected.lat],
                    ["Longitude", selected.lon],
                    ["Length",    `${selected.lengthKm.toFixed(1)} km`],
                    ["Width",     `${selected.widthKm.toFixed(1)} km`],
                    ["Heading",   `${String(selected.driftHeading).padStart(3,"0")}°`],
                    ["Drift",     `${selected.driftKn} kn`],
                    ["Uncertainty",`±${selected.uncertaintyNm} NM`],
                    ["CPA",       `${selected.cpaNm.toFixed(1)} NM`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10px] text-text-subtle">{k}</dt>
                      <dd className="mt-0.5 font-semibold text-navy-900">{v}</dd>
                    </div>
                  ))}
                </dl>

                {/* CPA warning */}
                {selected.cpaNm < 5 && (
                  <div className="flex items-start gap-2 rounded-lg border border-risk-high/30 bg-risk-high-bg px-3 py-2">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-risk-high" />
                    <p className="text-xs font-semibold text-risk-high">
                      CPA {selected.cpaNm.toFixed(1)} NM — below mandatory 5.0 NM standoff. Immediate course alteration required.
                    </p>
                  </div>
                )}

                <div className={cn("rounded-lg border px-3 py-2", riskBadge(selected.riskScore))}>
                  <p className="text-[10px] font-semibold mb-1">Risk Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/60 overflow-hidden">
                      <div className="h-full rounded-full bg-current" style={{ width: `${selected.riskScore}%` }} />
                    </div>
                    <span className="font-mono font-bold">{selected.riskScore}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <ChevronDown size={20} className="text-text-subtle mb-3" />
              <p className="text-sm font-semibold text-text-muted">Select a row</p>
              <p className="mt-1 text-xs text-text-subtle">Click any iceberg to open the inspection HUD</p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="mt-4">
        <SimpleMap selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
      </div>

      {/* Standoff note */}
      <div className="mt-4 rounded-xl border border-border bg-surface2 px-4 py-3">
        <p className="text-xs text-text-subtle">
          <strong className="text-text-muted">Mandatory 5.0 NM standoff</strong> for all tracked targets.
          CPA alerts fire when projected closest point of approach is below this threshold.
          Uncertainty corridors increase at 2.2× (3D) and 4.8× (7D) horizon multipliers.
        </p>
      </div>
    </AppShell>
  );
}
