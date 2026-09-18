"use client";

import { Search, X, ArrowUpDown } from "lucide-react";
import { type Mitigation } from "@/lib/data";
import { cn } from "@/lib/utils";

export type MitigationStatusFilter = "all" | "mandatory" | "recommended" | "advisory";
export type MitigationAckFilter = "all" | "pending" | "acknowledged";
export type MitigationSortOption = "priority" | "name" | "impact";

export interface MitigationFiltersProps {
  mitigations: Mitigation[];
  acked: Record<string, boolean>;
  statusFilter: MitigationStatusFilter;
  onStatusFilterChange: (status: MitigationStatusFilter) => void;
  ackFilter: MitigationAckFilter;
  onAckFilterChange: (ack: MitigationAckFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: MitigationSortOption;
  onSortByChange: (sort: MitigationSortOption) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export function MitigationFilters({
  mitigations,
  acked,
  statusFilter,
  onStatusFilterChange,
  ackFilter,
  onAckFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  onResetFilters,
  totalFilteredCount,
}: MitigationFiltersProps) {
  // Compute category counts
  const mandatoryCount = mitigations.filter((m) => m.status === "mandatory").length;
  const recommendedCount = mitigations.filter((m) => m.status === "recommended").length;
  const advisoryCount = mitigations.filter((m) => m.status === "advisory").length;

  const ackedCount = Object.values(acked).filter(Boolean).length;
  const pendingCount = mitigations.length - ackedCount;

  const isFiltered =
    statusFilter !== "all" ||
    ackFilter !== "all" ||
    searchQuery.trim() !== "" ||
    sortBy !== "priority";

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface2/60 p-3.5 no-print">
      {/* Top row: Search input + Sorting selector + Filter count summary */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search mitigations by title, guideline, SOP..."
            className="w-full rounded-lg border border-border bg-surface py-1.5 pl-9 pr-8 text-xs text-navy-900 placeholder:text-text-subtle transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-navy-900 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort control & Count summary */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs text-text-muted font-mono">
            Showing <strong className="text-navy-900">{totalFilteredCount}</strong> of {mitigations.length}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
              <ArrowUpDown size={12} className="text-text-subtle" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as MitigationSortOption)}
              className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-navy-900 shadow-xs transition-all focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="priority">Priority Order</option>
              <option value="name">Name (A-Z)</option>
              <option value="impact">Risk Impact</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom row: Status Pills + Acknowledgment Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-2.5">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
            Status:
          </span>
          {[
            { key: "all", label: "All", count: mitigations.length },
            { key: "mandatory", label: "Mandatory", count: mandatoryCount },
            { key: "recommended", label: "Recommended", count: recommendedCount },
            { key: "advisory", label: "Advisory", count: advisoryCount },
          ].map(({ key, label, count }) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onStatusFilterChange(key as MitigationStatusFilter)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                  active
                    ? key === "mandatory"
                      ? "bg-risk-high text-white font-semibold shadow-xs"
                      : key === "recommended"
                      ? "bg-risk-med text-white font-semibold shadow-xs"
                      : "bg-navy-900 text-white font-semibold shadow-xs"
                    : "bg-surface border border-border text-text-secondary hover:bg-surface2 hover:text-navy-900"
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-mono leading-none",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-canvas text-text-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Acknowledgment filters & Reset */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
            Ack:
          </span>
          {[
            { key: "all", label: "All", count: mitigations.length },
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "acknowledged", label: "Acknowledged", count: ackedCount },
          ].map(({ key, label, count }) => {
            const active = ackFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onAckFilterChange(key as MitigationAckFilter)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                  active
                    ? "bg-navy-900 text-white font-semibold shadow-xs"
                    : "bg-surface border border-border text-text-secondary hover:bg-surface2 hover:text-navy-900"
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-mono leading-none",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-canvas text-text-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Reset button when any filter active */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
