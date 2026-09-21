"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Navigation2,
  Snowflake,
  AlertTriangle,
  Ship,
  GitBranch,
  ShieldAlert,
  FileText,
  Settings,
  Compass,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMission } from "@/components/session/MissionContext";

const NAV = [
  {
    group: "OVERVIEW",
    items: [
      { href: "/dashboard", label: "Mission Control",  icon: LayoutDashboard },
    ],
  },
  {
    group: "PLAN",
    items: [
      { href: "/mission", label: "Mission Planner", icon: Navigation2 },
      { href: "/vessel",  label: "Vessel",          icon: Ship },
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      { href: "/environment", label: "Environment",  icon: Snowflake },
      { href: "/icebergs",    label: "Icebergs",     icon: Compass },
      { href: "/hazards",     label: "Hazards",      icon: AlertTriangle },
    ],
  },
  {
    group: "OPERATIONS",
    items: [
      { href: "/routes",  label: "Route Optimizer",   icon: GitBranch },
      { href: "/risk",    label: "Risk & Mitigation", icon: ShieldAlert },
      { href: "/reports", label: "Mission Report",    icon: FileText },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { simulationStatus } = useMission();

  return (
    <nav className="flex h-full flex-col overflow-y-auto">
      {/* Wordmark */}
      <div className="px-5 py-5">
        <p className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent leading-none">fordberg</p>
        <p className="text-[10px] text-text-muted mt-1">Antarctic Maritime DSS</p>
      </div>

      {/* Status pill */}
      <div className="mx-4 mb-4">
        <div className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
          simulationStatus === "completed"
            ? "border-risk-low/30 bg-risk-low-bg text-risk-low"
            : simulationStatus === "running"
            ? "border-risk-med/30 bg-risk-med-bg text-risk-med"
            : "border-border bg-surface2 text-text-muted"
        )}>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            simulationStatus === "completed" ? "bg-risk-low animate-pulse-dot" :
            simulationStatus === "running"   ? "bg-risk-med animate-pulse-dot" :
            "bg-text-subtle"
          )} />
          <span className="font-mono font-semibold uppercase tracking-wider">
            {simulationStatus === "idle" ? "Ready" : simulationStatus}
          </span>
        </div>
      </div>

      {/* Nav groups */}
      <div className="flex-1 space-y-5 px-3 pb-6">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-widest text-text-subtle">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-navy-900 text-white shadow-sm"
                          : "text-text-secondary hover:bg-border/60 hover:text-navy-900"
                      )}
                    >
                      <Icon
                        size={15}
                        className={cn(
                          "shrink-0",
                          active ? "text-blue-400" : "text-text-muted group-hover:text-navy-900"
                        )}
                      />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight size={12} className="text-blue-400" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom advisory */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] leading-relaxed text-text-subtle">
          Advisory only. Master & Ice Pilot retain sole command authority (SOLAS Ch. V / IMO Polar Code).
        </p>
      </div>
    </nav>
  );
}
