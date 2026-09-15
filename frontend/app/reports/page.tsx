"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useMission } from "@/components/session/MissionContext";
import { MITIGATIONS } from "@/lib/data";
import { formatFuelTons, formatHours, formatNauticalMiles, riskBadge, cn } from "@/lib/utils";
import { Printer, FileText, Anchor, Ship, Route, ShieldAlert } from "lucide-react";

const WAYPOINTS = [
  { id: "WP1", name: "Maxwell Bay Departure", lat: "62°12.4'S", lon: "58°57.0'W", distNm: 0,   etaHrs: 0,    speedKn: 0,   iceConc: "2.1/10" },
  { id: "WP2", name: "Antarctic Sound Entry", lat: "63°24.0'S", lon: "58°45.0'W", distNm: 85,  etaHrs: 7.1,  speedKn: 12,  iceConc: "4.2/10" },
  { id: "WP3", name: "Active Pass Choke",     lat: "64°08.0'S", lon: "57°30.0'W", distNm: 168, etaHrs: 14.0, speedKn: 9.5, iceConc: "6.5/10" },
  { id: "WP4", name: "Weddell Entry",         lat: "64°52.0'S", lon: "56°15.0'W", distNm: 285, etaHrs: 25.2, speedKn: 7.0, iceConc: "7.2/10" },
  { id: "WP5", name: "Weddell Outpost Alpha", lat: "65°30.0'S", lon: "56°00.0'W", distNm: 445, etaHrs: 37.1, speedKn: 12,  iceConc: "3.1/10" },
];

export default function ReportsPage() {
  const { mission, vessel, selectedRoute } = useMission();
  const generatedAt = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Mission Report</h1>
          <p className="mt-0.5 text-sm text-text-muted">Printable decision-support document</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition-colors shadow-sm"
        >
          <Printer size={15} />
          Export / Print Report
        </button>
      </div>

      {/* Printable document */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {/* Document header */}
        <div className="border-b border-border bg-navy-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <span className="text-sm font-bold">fB</span>
              </div>
              <div>
                <p className="text-lg font-bold">fordgeBurg</p>
                <p className="text-xs text-blue-200">Antarctic Maritime Decision Support System</p>
              </div>
            </div>
            <div className="text-right text-xs text-blue-200">
              <p className="font-mono">{generatedAt}</p>
              <p className="mt-0.5">Document Ref: FB-{Math.floor(Math.random() * 9000) + 1000}</p>
              <p className="mt-1 rounded border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-100">ADVISORY — NOT FOR NAVIGATION</p>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <h1 className="text-xl font-bold">{mission.name}</h1>
            <p className="mt-0.5 text-sm text-blue-200">{mission.origin} → {mission.destination} · {mission.distanceNm} NM baseline</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Vessel + Route summary */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ship size={14} className="text-text-muted" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Vessel Profile</h2>
              </div>
              <p className="font-bold text-navy-900">{vessel.name}</p>
              <p className="text-xs text-text-muted mt-0.5">Ice Class: {vessel.iceClass}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                {[
                  ["LOA", `${vessel.loaM} m`],
                  ["Beam", `${vessel.beamM} m`],
                  ["Draft", `${vessel.draftM} m`],
                  ["Ice limit", `${vessel.iceLimitKn} kn`],
                  ["Fuel/day", `${vessel.fuelTonsPerDay} MT`],
                  ["Open water", `${vessel.openWaterKn} kn`],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-text-subtle">{k}</dt>
                    <dd className="font-semibold text-navy-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Route size={14} className="text-text-muted" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Selected Route</h2>
              </div>
              <p className="font-bold text-navy-900">{selectedRoute.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{selectedRoute.tradeOff}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                {[
                  ["Distance", formatNauticalMiles(selectedRoute.distanceNm)],
                  ["ETA", formatHours(selectedRoute.etaHours)],
                  ["Fuel", formatFuelTons(selectedRoute.fuelTons)],
                  ["Avg risk", `${selectedRoute.averageRiskScore}/100`],
                  ["Max risk", `${selectedRoute.maxRiskScore}/100`],
                  ["Compat.", selectedRoute.compatibility],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-text-subtle">{k}</dt>
                    <dd className={cn("font-semibold",
                      k === "Avg risk" || k === "Max risk"
                        ? `border rounded px-1 ${riskBadge(parseInt(v as string))}`
                        : "text-navy-900"
                    )}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Waypoint Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Anchor size={14} className="text-text-muted" />
              <h2 className="text-sm font-semibold text-navy-900">Waypoint Schedule</h2>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface2 text-left">
                    {["WP","Name","Latitude","Longitude","Leg (NM)","ETA (hrs)","Speed (kn)","Ice Conc."].map(h => (
                      <th key={h} className="px-4 py-2.5 font-semibold text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WAYPOINTS.map((wp, i) => (
                    <tr key={wp.id} className={cn("border-b border-border", i % 2 === 1 ? "bg-surface2" : "")}>
                      <td className="px-4 py-2.5 font-mono font-bold text-navy-900">{wp.id}</td>
                      <td className="px-4 py-2.5 font-medium text-navy-900">{wp.name}</td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary">{wp.lat}</td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary">{wp.lon}</td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary">{wp.distNm}</td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary">{wp.etaHrs.toFixed(1)}</td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary">{wp.speedKn > 0 ? `${wp.speedKn} kn` : "—"}</td>
                      <td className="px-4 py-2.5 font-mono text-text-secondary">{wp.iceConc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consequence Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={14} className="text-text-muted" />
              <h2 className="text-sm font-semibold text-navy-900">Consequence Analysis</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Avg Risk Score", value: `${selectedRoute.averageRiskScore}/100` },
                { label: "Max Risk Score", value: `${selectedRoute.maxRiskScore}/100` },
                { label: "Vessel Compat.", value: selectedRoute.compatibility },
                { label: "Fuel Reserve",  value: `${(selectedRoute.fuelTons * 0.15).toFixed(1)} MT` },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-border p-3">
                  <p className="text-[10px] text-text-muted">{c.label}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-navy-900">{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mitigations (first 5) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-text-muted" />
              <h2 className="text-sm font-semibold text-navy-900">Operational Mitigations (5 of 7)</h2>
            </div>
            <div className="space-y-2">
              {MITIGATIONS.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
                  <span className={cn(
                    "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase",
                    m.status === "mandatory"   ? "border-risk-high/30 bg-risk-high-bg text-risk-high" :
                    m.status === "recommended" ? "border-risk-med/30 bg-risk-med-bg text-risk-med" :
                    "border-border bg-surface2 text-text-muted"
                  )}>
                    {m.status}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-navy-900">{m.title}</p>
                    <p className="text-xs text-text-muted">{m.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature blocks */}
          <div>
            <h2 className="text-sm font-semibold text-navy-900 mb-3">Authorization Signatures</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { role: "Master", title: "Vessel Master" },
                { role: "Ice Pilot", title: "Certified Ice Pilot" },
                { role: "Fleet Ops", title: "Fleet Operations Desk" },
              ].map(({ role, title }) => (
                <div key={role} className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold text-navy-900">{role}</p>
                  <p className="text-[10px] text-text-muted">{title}</p>
                  <div className="mt-4 border-b border-border" style={{ height: 40 }} />
                  <p className="mt-1 text-[10px] text-text-subtle">Signature / Date</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document footer */}
        <div className="border-t border-border bg-surface2 px-6 py-4">
          <p className="text-[10px] text-text-subtle text-center leading-relaxed">
            This document is an advisory decision-support output only. The Master and certified Ice Pilot retain sole command authority under SOLAS Ch. V and the IMO Polar Code. This system does not control the vessel and provides no autonomous navigation guidance. Generated: {generatedAt}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
