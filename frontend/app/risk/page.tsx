"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MITIGATIONS, type RouteId } from "@/lib/data";
import { useMission } from "@/components/session/MissionContext";
import { cn, riskBadge, riskBar, riskLabel } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ShieldCheck,
  Siren,
  ExternalLink,
  ChevronRight,
  Info,
  SlidersHorizontal,
} from "lucide-react";

import { RiskCharts } from "@/components/risk/RiskCharts";
import { TelemetryExportBar } from "@/components/risk/TelemetryExportBar";
import {
  MitigationFilters,
  type MitigationStatusFilter,
  type MitigationAckFilter,
  type MitigationSortOption,
} from "@/components/risk/MitigationFilters";
import { ConsequenceModal } from "@/components/risk/ConsequenceModal";
import { MitigationModal } from "@/components/risk/MitigationModal";
import { DynamicMitigationGraph } from "@/components/risk/DynamicMitigationGraph";
import { type ConsequenceItem } from "@/lib/riskExport";

const STATUS_STYLE: Record<string, string> = {
  mandatory: "border-risk-high/30 bg-risk-high-bg text-risk-high",
  recommended: "border-risk-med/30 bg-risk-med-bg text-risk-med",
  advisory: "border-border bg-surface2 text-text-muted",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  mandatory: Siren,
  recommended: AlertTriangle,
  advisory: ShieldCheck,
};

const PRIORITY_ORDER: Record<string, number> = {
  mandatory: 1,
  recommended: 2,
  advisory: 3,
};

export default function RiskPage() {
  const { mission, vessel, selectedRoute, selectedRouteId, setSelectedRouteId, routes } = useMission();

  // Acknowledgments state
  const [acked, setAcked] = useState<Record<string, boolean>>({});

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<MitigationStatusFilter>("all");
  const [ackFilter, setAckFilter] = useState<MitigationAckFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<MitigationSortOption>("priority");

  // Modal inspection states
  const [activeConsequenceKey, setActiveConsequenceKey] = useState<string | null>(null);
  const [activeMitigationId, setActiveMitigationId] = useState<string | null>(null);
  const [hoveredMitigationId, setHoveredMitigationId] = useState<string | null>(null);

  const isOpenWater = vessel.iceClass === "OpenWater";
  const risk = selectedRoute.averageRiskScore;

  // Consequences calculation
  const consequences: ConsequenceItem[] = useMemo(
    () => [
      {
        key: "besetment",
        label: "Besetment Risk",
        score: isOpenWater ? 75 : Math.min(85, Math.round(risk * 1.05)),
        value: isOpenWater ? "High" : risk > 50 ? "Elevated" : "Moderate",
        level: isOpenWater || risk > 50 ? "HIGH" : "MODERATE",
      },
      {
        key: "delay",
        label: "Transit Delay Risk",
        score: Math.min(95, Math.round(risk / 10) * 10),
        value: `${Math.max(4, Math.round(risk / 9))} hrs`,
        level: risk > 60 ? "HIGH" : risk > 35 ? "MODERATE" : "LOW",
      },
      {
        key: "fuel",
        label: "Fuel Penalty",
        score: Math.min(90, Math.round(risk / 5) * 5),
        value: `+${Math.max(5, Math.round(risk / 5))}%`,
        level: risk > 55 ? "HIGH" : "MODERATE",
      },
      {
        key: "disruption",
        label: "Route Disruption",
        score: risk > 50 ? 70 : 30,
        value: risk > 50 ? "High" : "Low",
        level: risk > 50 ? "HIGH" : "LOW",
      },
    ],
    [isOpenWater, risk]
  );

  const selectedConsequence = useMemo(
    () => consequences.find((c) => c.key === activeConsequenceKey) ?? null,
    [consequences, activeConsequenceKey]
  );

  // Acknowledgment metrics
  const ackedCount = Object.values(acked).filter(Boolean).length;
  const allAcked = ackedCount === MITIGATIONS.length;

  const toggleAck = (id: string) => {
    setAcked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAcknowledgeAll = () => {
    setAcked(Object.fromEntries(MITIGATIONS.map((m) => [m.id, true])));
  };

  const handleResetAcks = () => {
    setAcked({});
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setAckFilter("all");
    setSearchQuery("");
    setSortBy("priority");
  };

  // Filtered and sorted mitigations
  const filteredMitigations = useMemo(() => {
    let result = [...MITIGATIONS];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Ack filter
    if (ackFilter === "acknowledged") {
      result = result.filter((m) => !!acked[m.id]);
    } else if (ackFilter === "pending") {
      result = result.filter((m) => !acked[m.id]);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.detail.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "priority") {
        const pDiff = (PRIORITY_ORDER[a.status] ?? 9) - (PRIORITY_ORDER[b.status] ?? 9);
        if (pDiff !== 0) return pDiff;
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "impact") {
        return (PRIORITY_ORDER[a.status] ?? 9) - (PRIORITY_ORDER[b.status] ?? 9);
      }
      return 0;
    });

    return result;
  }, [statusFilter, ackFilter, searchQuery, sortBy, acked]);

  return (
    <AppShell>
      {/* Header with Title, Summary & Telemetry Export */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-navy-900">Risk &amp; Mitigation Intelligence</h1>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-700">
              POLAR CODE COMPLIANT
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Consequence analysis for corridor <strong className="text-navy-900">{selectedRoute.name}</strong> · Vessel:{" "}
            <span className="font-semibold text-navy-900">{vessel.name}</span> ({vessel.iceClass})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TelemetryExportBar
            payload={{
              mission,
              vessel,
              selectedRoute,
              consequences,
              mitigations: MITIGATIONS,
              acked,
              allRoutes: routes,
            }}
          />
          <span
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold shadow-xs",
              riskBadge(risk)
            )}
          >
            Avg risk {risk}/100
          </span>
        </div>
      </div>

      {/* Consequence Grid with Modal Deep-Dive Triggers */}
      <div className="mb-6">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Operational Consequence Assessment
            </h2>
            <span className="text-[11px] text-text-subtle">(Click card to inspect detailed SOP &amp; factor breakdown)</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {consequences.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActiveConsequenceKey(c.key)}
              className={cn(
                "group relative rounded-xl border border-border bg-surface p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md cursor-pointer",
                activeConsequenceKey === c.key && "ring-2 ring-blue-600 border-blue-600 bg-blue-50/20"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-muted group-hover:text-navy-900 transition-colors">
                  {c.label}
                </p>
                <ExternalLink
                  size={12}
                  className="text-text-subtle group-hover:text-blue-600 transition-colors"
                />
              </div>

              <p className="mt-2 font-mono text-2xl font-bold text-navy-900 group-hover:text-blue-700 transition-colors">
                {c.value}
              </p>

              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", riskBar(c.score))}
                    style={{ width: `${Math.min(c.score, 100)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-text-muted">{riskLabel(c.score)}</span>
                  <span className="font-mono text-text-subtle">{c.score}/100</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1 text-[10px] font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Inspect model</span>
                <ChevronRight size={10} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Risk Visualizations (Waypoint Profiles, Radar Chart, Benchmark) */}
      <div className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <RiskCharts
          routeId={selectedRouteId}
          vesselIceClass={vessel.iceClass}
          onSelectRoute={(id: RouteId) => setSelectedRouteId(id)}
          routes={routes}
        />
      </div>

      {/* Side-by-Side 50/50 Split: Tactical Mitigation Checklist (Left) & Dynamic Residual Risk Graph (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left: Mitigation Checklist Section */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {/* Header & Quick Actions */}
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-navy-900">Tactical Mitigation Measures</h2>
                <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs font-semibold text-text-muted">
                  {ackedCount}/{MITIGATIONS.length} Acknowledged
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">
                IMO Polar Code chapter 3 operational safeguards &amp; ice navigation SOPs
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Circular Progress Indicator */}
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke={allAcked ? "var(--color-risk-low)" : "var(--color-blue-600)"}
                    strokeWidth="3"
                    strokeDasharray={`${(ackedCount / MITIGATIONS.length) * 94.2} 94.2`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="text-[11px]">
                  <p className="font-mono font-bold text-navy-900">
                    {Math.round((ackedCount / MITIGATIONS.length) * 100)}%
                  </p>
                  <p className="text-[10px] text-text-subtle">Completed</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAcknowledgeAll}
                  disabled={allAcked}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer",
                    allAcked
                      ? "border border-border bg-surface2 text-text-subtle cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  Ack All
                </button>
                {ackedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAcks}
                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-surface2 hover:text-navy-900 transition-colors cursor-pointer"
                    title="Reset all acknowledgments"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter controls bar */}
          <div className="p-4 border-b border-border/80">
            <MitigationFilters
              mitigations={MITIGATIONS}
              acked={acked}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              ackFilter={ackFilter}
              onAckFilterChange={setAckFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onResetFilters={handleResetFilters}
              totalFilteredCount={filteredMitigations.length}
            />
          </div>

          {/* Mitigations List */}
          <div className="divide-y divide-border">
            {filteredMitigations.length === 0 ? (
              <div className="py-10 text-center">
                <Info size={24} className="mx-auto text-text-subtle mb-2" />
                <p className="text-sm font-semibold text-navy-900">No matching mitigations found</p>
                <p className="text-xs text-text-muted mt-1">Try adjusting or clearing your search and filter criteria.</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-surface2 cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              filteredMitigations.map((m) => {
                const Icon = STATUS_ICON[m.status] ?? ShieldCheck;
                const isAck = !!acked[m.id];
                const isHovered = hoveredMitigationId === m.id;

                return (
                  <div
                    key={m.id}
                    onMouseEnter={() => setHoveredMitigationId(m.id)}
                    onMouseLeave={() => setHoveredMitigationId(null)}
                    className={cn(
                      "flex flex-col gap-3 px-5 py-3.5 transition-all sm:flex-row sm:items-center sm:justify-between",
                      isHovered ? "bg-blue-50/40 ring-1 ring-inset ring-blue-300/60" : isAck ? "bg-surface" : "bg-surface hover:bg-surface2/50"
                    )}
                  >
                    {/* Left: Checkbox + Status icon + Title & Detail */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleAck(m.id)}
                        className="mt-0.5 shrink-0 text-text-muted hover:text-blue-600 transition-colors cursor-pointer"
                        title={isAck ? "Mark unacknowledged" : "Mark acknowledged"}
                      >
                        {isAck ? (
                          <CheckCircle2 size={18} className="text-risk-low" />
                        ) : (
                          <Circle size={18} className="text-border-strong hover:text-text-muted" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "font-semibold text-sm transition-colors",
                              isAck ? "text-text-muted line-through" : "text-navy-900"
                            )}
                          >
                            {m.title}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              STATUS_STYLE[m.status]
                            )}
                          >
                            <Icon size={10} />
                            {m.status}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 text-xs leading-relaxed transition-colors",
                            isAck ? "text-text-subtle" : "text-text-secondary"
                          )}
                        >
                          {m.detail}
                        </p>
                      </div>
                    </div>

                    {/* Right: Modal SOP Details Trigger */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveMitigationId(m.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-navy-900 hover:border-border-strong hover:bg-surface2 transition-all cursor-pointer"
                      >
                        <span>View SOP</span>
                        <ExternalLink size={11} className="text-text-muted" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Sticky Dynamic Residual Risk & Impact Graph */}
        <div className="lg:sticky lg:top-4">
          <DynamicMitigationGraph
            baselineRisk={risk}
            vesselIceClass={vessel.iceClass}
            acked={acked}
            hoveredMitigationId={hoveredMitigationId}
            onSelectMitigation={(id) => setActiveMitigationId(id)}
          />
        </div>
      </div>

      {/* Modal Dialogs */}
      {selectedConsequence && (
        <ConsequenceModal
          isOpen={!!activeConsequenceKey}
          onClose={() => setActiveConsequenceKey(null)}
          consequenceKey={selectedConsequence.key}
          consequenceScore={selectedConsequence.score}
          consequenceValue={selectedConsequence.value}
          vessel={vessel}
          selectedRoute={selectedRoute}
        />
      )}

      {activeMitigationId && (
        <MitigationModal
          isOpen={!!activeMitigationId}
          onClose={() => setActiveMitigationId(null)}
          mitigationId={activeMitigationId}
          isAcknowledged={!!acked[activeMitigationId]}
          onToggleAcknowledge={(id) => toggleAck(id)}
          activeVesselClass={vessel.iceClass}
        />
      )}
    </AppShell>
  );
}
