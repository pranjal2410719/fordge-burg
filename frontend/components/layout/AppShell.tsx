"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Anchor, Bell } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useMission } from "@/components/session/MissionContext";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { simulationStatus, mission, vessel } = useMission();

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ── Desktop sidebar (fixed) ── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start overflow-hidden border-r border-border bg-surface md:flex md:flex-col">
        <Sidebar />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 bg-surface shadow-xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Right column ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ── Topbar ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur-sm px-4 py-3 gap-4">
          {/* Left: mobile toggle + brand */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-border p-2 text-text-muted hover:bg-border/60 md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
            <div className="md:hidden">
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-base font-extrabold tracking-tight text-transparent">fordgeBurg</span>
            </div>
          </div>

          {/* Center: mission + vessel context */}
          <div className="hidden items-center gap-3 md:flex flex-1 min-w-0">
            <Anchor size={14} className="shrink-0 text-text-muted" />
            <span className="truncate text-sm font-medium text-text-primary">{mission.name}</span>
            <span className="h-1 w-1 rounded-full bg-border-strong shrink-0" />
            <span className="truncate text-sm text-text-muted">{vessel.name}</span>
            <span className="shrink-0 rounded-md border border-border px-2 py-0.5 font-mono text-xs text-text-muted">
              {vessel.iceClass}
            </span>
          </div>

          {/* Right: status + new mission */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:flex",
              simulationStatus === "completed"
                ? "border-risk-low/40 bg-risk-low-bg text-risk-low"
                : simulationStatus === "running"
                ? "border-risk-med/40 bg-risk-med-bg text-risk-med"
                : "border-border bg-surface2 text-text-muted"
            )}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                simulationStatus === "completed" ? "bg-risk-low" :
                simulationStatus === "running"   ? "bg-risk-med animate-pulse-dot" :
                "bg-text-subtle"
              )} />
              {simulationStatus === "idle" ? "Idle" :
               simulationStatus === "running" ? "Simulating…" : "Analysis ready"}
            </span>
            <button className="rounded-lg border border-border p-2 text-text-muted hover:bg-border/60" aria-label="Notifications">
              <Bell size={15} />
            </button>
            <Link
              href="/mission"
              className="rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
            >
              New mission
            </Link>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
