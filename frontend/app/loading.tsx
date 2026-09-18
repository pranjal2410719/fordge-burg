"use client";

import { AppShell } from "@/components/layout/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="animate-fade-in space-y-6">
        {/* Header skeleton */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="h-6 w-64 rounded-lg bg-surface2 animate-pulse-dot" />
            <div className="mt-2 h-4 w-96 rounded-md bg-surface2 animate-pulse-dot" />
          </div>
          <div className="h-9 w-40 rounded-lg bg-surface2 animate-pulse-dot" />
        </div>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-surface2 animate-pulse-dot" />
                <div className="h-3 w-20 rounded bg-surface2 animate-pulse-dot" />
              </div>
              <div className="h-5 w-16 rounded bg-surface2 animate-pulse-dot" />
              <div className="h-2 w-full rounded-full bg-surface2 animate-pulse-dot" />
            </div>
          ))}
        </div>

        {/* Content area skeleton */}
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <div className="h-4 w-48 rounded bg-surface2 animate-pulse-dot" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-surface2 animate-pulse-dot"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface shadow-sm p-5">
            <div className="h-4 w-32 rounded bg-surface2 animate-pulse-dot mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded-lg bg-surface2 animate-pulse-dot"
                  style={{ animationDelay: `${i * 70}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
