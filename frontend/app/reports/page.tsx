"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useMission } from "@/components/session/MissionContext";
import { MITIGATIONS } from "@/lib/data";
import { formatFuelTons, formatHours, formatNauticalMiles, riskBadge, cn } from "@/lib/utils";
import { Printer, FileText, Anchor, Ship, Route, ShieldAlert } from "lucide-react";

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
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Selected Route Profile</h2>
              </div>
              <p className="font-bold text-navy-900">{selectedRoute.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{selectedRoute.tradeOff}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                {[
                  ["Distance", formatNauticalMiles(selectedRoute.distanceNm)],
                  ["ETA", formatHours(selectedRoute.etaHours)],
                  ["Fuel Burn", formatFuelTons(selectedRoute.fuelTons)],
                  ["Avg / Max Risk", `${selectedRoute.averageRiskScore} / ${selectedRoute.maxRiskScore}`],
                  ["POLARIS RIO", `${selectedRoute.rio.scoreFormatted} (${selectedRoute.rio.status})`],
                  ["Peak Ice Conc", `${selectedRoute.iceExposure.peakIceConcTenths}/10 (${selectedRoute.iceExposure.peakLocation})`],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-text-subtle">{k}</dt>
                    <dd className={cn("font-semibold",
                      k === "Avg / Max Risk"
                        ? `border rounded px-1 ${riskBadge(selectedRoute.averageRiskScore)}`
                        : k === "POLARIS RIO" && selectedRoute.rio.status === "PASS"
                        ? "text-risk-low"
                        : "text-navy-900"
                    )}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Dynamic Waypoint Schedule */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Anchor size={14} className="text-text-muted" />
                <h2 className="text-sm font-semibold text-navy-900">
                  Waypoint Schedule — {selectedRoute.name} ({selectedRoute.waypoints.length} Waypoints)
                </h2>
              </div>
              <span className="text-xs font-mono text-text-muted">Total: {formatNauticalMiles(selectedRoute.distanceNm)}</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface2 text-left">
                    {["WP", "Name", "Latitude", "Longitude", "Leg (NM)", "Cumul (NM)", "Speed Cap", "Ice Conc", "Risk", "Operational Note"].map((h) => (
                      <th key={h} className="px-3.5 py-2.5 font-semibold text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedRoute.waypoints.map((wp, i) => (
                    <tr key={wp.id} className={cn("border-b border-border", i % 2 === 1 ? "bg-surface2" : "")}>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-navy-900">{wp.id.toUpperCase()}</td>
                      <td className="px-3.5 py-2.5 font-medium text-navy-900">{wp.name}</td>
                      <td className="px-3.5 py-2.5 font-mono text-text-secondary">{wp.lat}</td>
                      <td className="px-3.5 py-2.5 font-mono text-text-secondary">{wp.lon}</td>
                      <td className="px-3.5 py-2.5 font-mono text-text-secondary">{wp.distNm} NM</td>
                      <td className="px-3.5 py-2.5 font-mono text-navy-900 font-bold">{wp.cumulativeNm} NM</td>
                      <td className="px-3.5 py-2.5 font-mono text-text-secondary">{wp.speedLimitKn} kn</td>
                      <td className="px-3.5 py-2.5 font-mono text-text-secondary">{wp.iceConcTenths}/10</td>
                      <td className="px-3.5 py-2.5 font-mono">
                        <span className={cn("border rounded px-1.5 py-0.5 text-[10px] font-bold", riskBadge(wp.riskScore))}>
                          {wp.riskScore}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-text-muted font-sans text-[11px]">{wp.hazardNote}</td>
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
