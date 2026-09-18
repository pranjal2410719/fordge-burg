import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-md mb-6">
          <Compass size={28} className="animate-spin" style={{ animationDuration: "8s" }} />
        </div>
        <h1 className="text-3xl font-bold text-navy-900">Sector Not Found</h1>
        <p className="mt-2 text-sm text-text-muted max-w-md">
          The requested navigation sector does not exist in the current mission configuration.
          Verify the route coordinates and try again.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface2 hover:border-border-strong transition-all shadow-xs"
          >
            <ArrowLeft size={14} />
            Return to Overview
          </Link>
          <Link
            href="/mission"
            className="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-800 transition-all shadow-sm"
          >
            <Compass size={14} />
            Mission Planner
          </Link>
        </div>
        <p className="mt-8 font-mono text-[10px] text-text-subtle">
          HTTP 404 · POLARIS Navigation System
        </p>
      </div>
    </AppShell>
  );
}
