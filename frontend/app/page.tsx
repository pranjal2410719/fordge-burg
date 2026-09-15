"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Search, ArrowRight, LayoutDashboard, Navigation2, GitBranch, ShieldAlert, Snowflake, Compass, AlertTriangle, Ship, FileText, Settings } from "lucide-react";

const QUICK_JUMPS = [
  { href: "/dashboard",   label: "Mission Control",  icon: LayoutDashboard, desc: "KPIs, map & vessel status" },
  { href: "/mission",     label: "Mission Planner",  icon: Navigation2,     desc: "Configure & run simulation" },
  { href: "/routes",      label: "Route Optimizer",  icon: GitBranch,       desc: "Compare 4 alternatives" },
  { href: "/risk",        label: "Risk & Mitigation",icon: ShieldAlert,     desc: "Consequence analysis" },
  { href: "/environment", label: "Environment",      icon: Snowflake,       desc: "Sea-ice & metocean" },
  { href: "/icebergs",    label: "Icebergs",         icon: Compass,         desc: "8 tracked targets" },
];

const ALL_MODULES = [
  { href: "/hazards",  label: "Hazards",  icon: AlertTriangle },
  { href: "/vessel",   label: "Vessel",   icon: Ship },
  { href: "/reports",  label: "Reports",  icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function routeForQuery(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("iceberg") || s.includes("berg"))                      return "/icebergs";
  if (s.includes("ice") || s.includes("weather") || s.includes("env")) return "/environment";
  if (s.includes("route") || s.includes("path"))                        return "/routes";
  if (s.includes("risk") || s.includes("mitigation"))                   return "/risk";
  if (s.includes("mission") || s.includes("plan"))                      return "/mission";
  if (s.includes("vessel") || s.includes("ship"))                       return "/vessel";
  if (s.includes("hazard"))                                             return "/hazards";
  if (s.includes("report"))                                             return "/reports";
  if (s.includes("setting") || s.includes("config"))                    return "/settings";
  if (s.includes("dashboard") || s.includes("control"))                 return "/dashboard";
  return "/dashboard";
}

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-2 py-12">
        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse-dot" />
            Antarctic Maritime Decision Support
          </div>
          <h1 className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            fordgeBurg
          </h1>
          <p className="mt-3 text-base text-text-muted max-w-md mx-auto">
            Ask your polar operations workspace anything — get routed to the right intelligence module.
          </p>
        </div>

        {/* Search */}
        <form
          className="mt-8 relative"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) router.push(routeForQuery(query));
          }}
        >
          <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 py-3 shadow-sm focus-within:border-blue-600 transition-colors">
            <Search size={18} className="shrink-0 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "ice conditions", "best route", "vessel capability"…'
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-subtle outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-navy-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
              disabled={!query.trim()}
            >
              Go
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-text-subtle">
            Keyword routing — ice · route · risk · iceberg · vessel · hazard · mission
          </p>
        </form>

        {/* Quick jump grid */}
        <div className="mt-10">
          <p className="mb-3 text-xs font-semibold tracking-wider text-text-subtle uppercase">Quick Jump</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_JUMPS.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm hover:border-blue-600 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 border border-border group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                    <Icon size={15} className="text-text-muted group-hover:text-blue-600 transition-colors" />
                  </div>
                  <ArrowRight size={13} className="text-text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{label}</p>
                  <p className="text-xs text-text-muted">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* More modules — completes 11-route IA */}
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold tracking-wider text-text-subtle uppercase">More modules</p>
          <div className="flex flex-wrap gap-2">
            {ALL_MODULES.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-sm hover:border-blue-600 hover:text-navy-900 transition-colors"
              >
                <Icon size={13} className="text-text-muted" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-center text-[11px] text-text-subtle leading-relaxed">
          Advisory decision support only. The Master and certified Ice Pilot retain sole command authority under SOLAS Ch. V and the IMO Polar Code. No autonomous navigation.
        </p>
      </div>
    </AppShell>
  );
}
